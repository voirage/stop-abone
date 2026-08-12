import os
import logging

logger = logging.getLogger("uvicorn.error")

def send_reset_password_email(to_email: str, token: str, frontend_url: str = None):
    is_production = os.environ.get("RENDER") is not None
    
    if is_production:
        frontend_url = os.environ.get("FRONTEND_URL", "https://stop-abone.vercel.app")
    else:
        if not frontend_url or frontend_url == "null" or str(frontend_url).strip() == "":
            frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
            
    # Nettoyer l'URL au cas où elle finirait par un slash
    frontend_url = frontend_url.rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    logger.warning(f"RESET_URL_GENERATED = {reset_link}")
    
    smtp_host = os.environ.get("SMTP_HOST")
    
    if smtp_host:
        # Implémentation SMTP réelle si configurée
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from email.utils import formatdate, make_msgid
        
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USERNAME")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", "noreply@stop-abos.fr")
        smtp_use_tls_env = os.environ.get("SMTP_USE_TLS", "true")
        smtp_use_tls = str(smtp_use_tls_env).lower() in ("true", "1", "t")
        
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = "STOP-ABOS — Réinitialisation de votre mot de passe"
        msg['Date'] = formatdate(localtime=True)
        msg['Message-ID'] = make_msgid(domain="stop-abos.fr")
        
        body = f"""Bonjour,
        
Vous avez demandé à réinitialiser votre mot de passe sur STOP-ABOS.
Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :

{reset_link}

Ce lien est valide pendant 30 minutes. S'il a expiré, veuillez refaire une demande.
Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.

L'équipe STOP-ABOS
"""
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        try:
            logger.warning(f"[DEBUG EMAIL] Tentative d'envoi via Brevo API (HTTP) pour contourner le blocage SMTP de Render...")
            
            import urllib.request
            import json
            
            brevo_api_url = "https://api.brevo.com/v3/smtp/email"
            
            payload = {
                "sender": {"email": smtp_from, "name": "STOP-ABOS"},
                "to": [{"email": to_email}],
                "subject": "STOP-ABOS — Réinitialisation de votre mot de passe",
                "htmlContent": f"""
                <p>Bonjour,</p>
                <p>Vous avez demandé à réinitialiser votre mot de passe sur STOP-ABOS.</p>
                <p>Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
                <p><a href="{reset_link}">{reset_link}</a></p>
                <p>Ce lien est valide pendant 30 minutes. S'il a expiré, veuillez refaire une demande.</p>
                <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
                <p>L'équipe STOP-ABOS</p>
                """
            }
            
            req = urllib.request.Request(brevo_api_url, method="POST")
            req.add_header("accept", "application/json")
            req.add_header("api-key", smtp_password)  # L'API key Brevo est la même que le mot de passe SMTP (xsmtpsib-...)
            req.add_header("content-type", "application/json")
            
            # Envoi de la requête
            with urllib.request.urlopen(req, data=json.dumps(payload).encode('utf-8')) as response:
                res_data = response.read().decode('utf-8')
                logger.warning(f"[DEBUG EMAIL] Succès API Brevo (code {response.status}) : {res_data}")
                
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            logger.error(f"[EMAIL SERVICE ERROR] Rejet par API Brevo - Code: {e.code}, Message exact: {error_body}")
        except Exception as e:
            logger.error(f"[EMAIL SERVICE ERROR] Exception générale lors de l'envoi Brevo API: {e}")
    else:
        # Mock en local
        logger.warning(f"=== [MOCK EMAIL SERVICE] ===")
        logger.warning(f"Sujet: STOP-ABOS — Réinitialisation de votre mot de passe")
        logger.warning(f"Destinataire: {to_email}")
        logger.warning(f"Le SMTP est désactivé. Voici le lien complet de réinitialisation :")
        logger.warning(f"{reset_link}")
        logger.warning(f"==============================")
