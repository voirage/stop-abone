import os
import logging

logger = logging.getLogger("uvicorn.error")

def send_reset_password_email(to_email: str, token: str):
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    smtp_host = os.environ.get("SMTP_HOST")
    
    if smtp_host:
        # Implémentation SMTP réelle si configurée
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_USERNAME")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", "noreply@stop-abos.fr")
        smtp_use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() in ("true", "1", "t")
        
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = "STOP-ABOS — Réinitialisation de votre mot de passe"
        
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
            server = smtplib.SMTP(smtp_host, smtp_port)
            if smtp_use_tls:
                server.starttls()
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            logger.error(f"[EMAIL SERVICE ERROR] Erreur lors de l'envoi SMTP: {e}")
    else:
        # Mock en local
        logger.warning(f"=== [MOCK EMAIL SERVICE] ===")
        logger.warning(f"Sujet: STOP-ABOS — Réinitialisation de votre mot de passe")
        logger.warning(f"Destinataire: {to_email}")
        logger.warning(f"Le SMTP est désactivé. Voici le lien complet de réinitialisation :")
        logger.warning(f"{reset_link}")
        logger.warning(f"==============================")
