from fpdf import FPDF
import datetime
import tempfile
import os

class LettreResiliationPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Objet : Résiliation d\'abonnement', border=False, align='C')
        self.ln(20)

def generer_lettre_resiliation(nom_service: str, numero_contrat: str, date_fin: str) -> str:
    pdf = LettreResiliationPDF()
    pdf.add_page()
    pdf.set_font("helvetica", size=12)
    
    # Destinataire (générique)
    pdf.cell(0, 10, txt=f"Service Client : {nom_service}", ln=True)
    pdf.ln(10)
    
    # Date
    date_jour = datetime.datetime.now().strftime("%d/%m/%Y")
    pdf.cell(0, 10, txt=f"Fait le {date_jour}", ln=True, align='R')
    pdf.ln(10)
    
    # Corps de la lettre
    texte = f"""Madame, Monsieur,

Par la présente, je vous informe de ma volonté de résilier mon abonnement au service {nom_service}.

Conformément aux conditions générales de vente et à la loi applicable (notamment les dispositions de la loi Chatel et de la loi Hamon si applicables), je souhaite que cette résiliation prenne effet à la prochaine date de renouvellement prévue, soit le {date_fin}.

Mon numéro d'abonné / contrat est le suivant : {numero_contrat if numero_contrat else 'Non précisé'}.

Je vous prie de bien vouloir prendre en compte ma demande dès réception et suspendre tout prélèvement automatique sur mon compte bancaire à compter de la date d'effet de la résiliation.

Veuillez m'envoyer une confirmation écrite de la prise en compte de cette demande et de la date effective de clôture.

Cordialement,

Votre Client"""

    pdf.multi_cell(0, 10, txt=texte)
    
    fd, path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    pdf.output(path)
    return path
