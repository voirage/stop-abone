import csv
import io
import re
import datetime
from collections import defaultdict
import schemas

def normalize_string(s: str) -> str:
    if not s:
        return ""
    # Convert to uppercase
    s = s.upper()
    # Remove accents/diacritics if necessary, but simple replace for now:
    s = s.replace('É', 'E').replace('È', 'E').replace('Ê', 'E').replace('À', 'A').replace('Ô', 'O')
    # Remove common prefixes/suffixes
    s = re.sub(r'\b(CB|PRLV SEPA|PRLV|SEPA|CARTE|PAIEMENT|VIR|VIREMENT|PRELEVEMENT)\b', '', s)
    s = s.replace('.COM', '').replace('.FR', '')
    # Remove dates (e.g. 0507, 2026, 05/07)
    s = re.sub(r'\b\d{2}/\d{2}\b', '', s)
    s = re.sub(r'\b\d{4}\b', '', s)
    # Remove other numbers (like card numbers or random IDs)
    s = re.sub(r'\d+', '', s)
    # Remove special characters except spaces
    s = re.sub(r'[^\w\s]', ' ', s)
    # Clean up multiple spaces
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def parse_date(date_str: str) -> datetime.date:
    date_str = date_str.strip()
    formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%Y/%m/%d']
    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_str, fmt).date()
        except ValueError:
            pass
    return None

def parse_amount(amount_str: str) -> float:
    # Remove spaces, € symbols
    amount_str = amount_str.replace(' ', '').replace('€', '').strip()
    # Replace comma with dot
    amount_str = amount_str.replace(',', '.')
    try:
        val = float(amount_str)
        return val
    except ValueError:
        return None

def detect_delimiter(header_line: str) -> str:
    if ';' in header_line:
        return ';'
    return ','

def guess_category(libelle: str) -> str:
    lib_lower = libelle.lower()
    if any(x in lib_lower for x in ['netflix', 'disney', 'canal', 'prime', 'amazon', 'video']):
        return 'Streaming'
    if any(x in lib_lower for x in ['spotify', 'deezer', 'apple music']):
        return 'Musique'
    if any(x in lib_lower for x in ['adobe', 'microsoft', 'google one', 'dropbox', 'cloud', 'apple']):
        return 'Logiciel ou Cloud'
    if any(x in lib_lower for x in ['orange', 'sfr', 'bouygues', 'free', 'sosh', 'red']):
        return 'Telecom'
    if any(x in lib_lower for x in ['basic fit', 'basic-fit', 'fitness', 'neoness']):
        return 'Sport'
    return 'Autre'

def classify_transaction(libelle: str, category: str, variance_high: bool) -> tuple[schemas.TypeRecurrent, str]:
    lib_lower = libelle.lower()
    
    # 1. NON_SUBSCRIPTION
    non_sub_keywords = [
        'loyer', 'bailleur', 'regie', 'restaurant', 'uber', 'deliveroo', 'mcdonald', 'kfc',
        'supermarche', 'carrefour', 'auchan', 'leclerc', 'lidl', 'aldi', 'intermarche',
        'sncf', 'ratp', 'trainline', 'totalenergies station', 'esso', 'bp', 'shell', 'eni',
        'virement', 'remboursement', 'salaire', 'cpam', 'pharmacie'
    ]
    if any(re.search(rf'\b{re.escape(kw)}\b', lib_lower) for kw in non_sub_keywords) or 'station' in lib_lower:
        return schemas.TypeRecurrent.NON_SUBSCRIPTION, "Faible"
        
    if category in ['Alimentation', 'Transport ponctuel']:
        return schemas.TypeRecurrent.NON_SUBSCRIPTION, "Faible"

    # 2. RECURRING_CONTRACT
    recurring_keywords = [
        'edf', 'engie', 'totalenergies', 'total energie', 'eau', 'saur', 'veolia', 
        'assurance', 'axa', 'macif', 'maif', 'allianz', 'credit', 'pret', 'impot', 'tresor public',
        'frais', 'cotisation', 'banque', 'mutuelle'
    ]
    if any(re.search(rf'\b{re.escape(kw)}\b', lib_lower) for kw in recurring_keywords):
        if 'station' in lib_lower:
            return schemas.TypeRecurrent.NON_SUBSCRIPTION, "Faible"
        return schemas.TypeRecurrent.RECURRING_CONTRACT, "Moyen"

    # 3. SUBSCRIPTION
    sub_keywords = [
        r'netflix', r'spotify', r'amazon', r'prime', r'adobe', r'canal', r'canal\+', r'fitness park',
        r'basic fit', r'orange', r'sfr', r'free', r'bouygues', r'apple', r'disney', r'deezer',
        r'microsoft', r'google', r'dropbox', r'xbox', r'playstation', r'nintendo', r'presse', r'lemonde', r'le monde'
    ]
    if any(re.search(rf'\b{kw}\b', lib_lower) for kw in sub_keywords):
        return schemas.TypeRecurrent.SUBSCRIPTION, "Élevé"
        
    # Default fallback
    if variance_high:
        return schemas.TypeRecurrent.NON_SUBSCRIPTION, "Faible"
        
    return schemas.TypeRecurrent.SUBSCRIPTION, "Faible"

def analyze_csv(file_content: bytes) -> list:
    content_str = file_content.decode('utf-8', errors='replace')
    lines = content_str.splitlines()
    if not lines:
        return []

    delimiter = detect_delimiter(lines[0])
    reader = csv.DictReader(lines, delimiter=delimiter)
    
    # Identify columns
    headers = reader.fieldnames
    if not headers:
        return []
    
    date_col = None
    libelle_col = None
    montant_col = None
    
    for h in headers:
        hl = h.lower().strip()
        if not date_col and any(x in hl for x in ['date']):
            date_col = h
        if not libelle_col and any(x in hl for x in ['libell', 'description', 'merchant', 'commer', 'beneficiaire']):
            libelle_col = h
        if not montant_col and any(x in hl for x in ['montant', 'amount', 'debit', 'débit']):
            montant_col = h
            
    # Fallback
    if len(headers) >= 3 and not (date_col and libelle_col and montant_col):
        if not date_col: date_col = headers[0]
        if not libelle_col: libelle_col = headers[1]
        if not montant_col: montant_col = headers[2]

    if not date_col or not libelle_col or not montant_col:
        return []

    transactions_by_merchant = defaultdict(list)
    
    for row in reader:
        try:
            d_str = row.get(date_col, '')
            l_str = row.get(libelle_col, '')
            m_str = row.get(montant_col, '')
            
            d = parse_date(d_str)
            m = parse_amount(m_str)
            
            if d is None or m is None or not l_str:
                continue
                
            if m > 0 and 'debit' not in montant_col.lower() and 'débit' not in montant_col.lower() and 'montant' not in montant_col.lower():
                # Might be an income if the column is explicitly named 'credit'
                if any(x in montant_col.lower() for x in ['credit', 'crédit']):
                    continue
                
            norm_lib = normalize_string(l_str)
            if not norm_lib:
                continue
                
            transactions_by_merchant[norm_lib].append({
                'date': d,
                'libelle_original': l_str,
                'montant': abs(m)
            })
        except Exception:
            continue
            
    candidates = []
    
    for merchant, txs in transactions_by_merchant.items():
        if len(txs) < 2:
            continue
            
        txs.sort(key=lambda x: x['date'])
        
        amounts = [t['montant'] for t in txs]
        avg_amount = sum(amounts) / len(amounts)
        last_amount = amounts[-1]
        
        variance_high = any(abs(a - avg_amount) / avg_amount > 0.15 for a in amounts if avg_amount > 0)
            
        dates = [t['date'] for t in txs]
        intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
        avg_interval = sum(intervals) / len(intervals)
        
        freq = None
        if 5 <= avg_interval <= 9:
            freq = schemas.FrequenceAbonnement.MENSUEL
            frequence_str = "hebdomadaire"
        elif 25 <= avg_interval <= 35:
            freq = schemas.FrequenceAbonnement.MENSUEL
            frequence_str = "mensuelle"
        elif 80 <= avg_interval <= 100:
            freq = schemas.FrequenceAbonnement.MENSUEL
            frequence_str = "trimestrielle"
        elif 330 <= avg_interval <= 400:
            freq = schemas.FrequenceAbonnement.ANNUEL
            frequence_str = "annuelle"
        else:
            continue
            
        category = guess_category(merchant)
        type_recurrent, base_confidence = classify_transaction(merchant, category, variance_high)
        
        # Adjust confidence based on transaction quality
        confidence = base_confidence
        if type_recurrent == schemas.TypeRecurrent.SUBSCRIPTION:
            if len(txs) >= 3 and all(abs(i - avg_interval) <= 5 for i in intervals) and not variance_high:
                if base_confidence != "Élevé":
                    confidence = "Moyen"
            elif variance_high or len(txs) == 2:
                confidence = "Faible"
                
        next_date = dates[-1] + datetime.timedelta(days=int(avg_interval))
        last_libelle = txs[-1]['libelle_original']
        
        explication = f"{len(txs)} paiements de fréquence {frequence_str} d'environ {avg_amount:.2f} € ont été détectés entre {dates[0].strftime('%d/%m/%Y')} et {dates[-1].strftime('%d/%m/%Y')}."
        
        candidates.append({
            "nom": merchant.title() if merchant else last_libelle,
            "categorie": category,
            "prix": round(last_amount, 2),
            "frequence": freq,
            "prochaine_date_renouvellement": next_date,
            "date_souscription": dates[0],
            "statut": schemas.StatutAbonnement.ACTIF,
            "type_recurrent": type_recurrent,
            "renouvellement_auto": True,
            "source_detection": "import_csv",
            "libelle_detection": last_libelle,
            "nombre_paiements_detectes": len(txs),
            "date_premier_paiement": dates[0],
            "date_dernier_paiement": dates[-1],
            "confiance_detection": confidence,
            "explication_detection": explication
        })
        
    return candidates
