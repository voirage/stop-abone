import os
import logging

logger = logging.getLogger("uvicorn.error")

def send_reset_password_email(to_email: str, token: str, frontend_url: str = None):
    if not frontend_url or frontend_url == "null" or str(frontend_url).strip() == "":
        is_production = os.environ.get("RENDER") is not None
        default_url = "https://stop-abone.vercel.app" if is_production else "http://localhost:5173"
        frontend_url = os.environ.get("FRONTEND_URL", default_url)
        
    # Nettoyer l'URL au cas où elle finirait par un slash
    frontend_url = frontend_url.rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
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
            logger.warning(f"[DEBUG EMAIL] Connexion à {smtp_host}:{smtp_port}...")
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.set_debuglevel(1)  # Affiche toute la conversation SMTP (codes et textes)
            if smtp_use_tls:
                server.starttls()
                logger.warning("[DEBUG EMAIL] TLS activé.")
            if smtp_user and smtp_password:
                server.login(smtp_user, smtp_password)
                logger.warning("[DEBUG EMAIL] Authentification réussie.")
            
            refused = server.send_message(msg)
            if not refused:
                logger.warning("[DEBUG EMAIL] Succès absolu : Le message a été accepté par Brevo (code 250 OK). Aucun refus.")
            else:
                logger.warning(f"[DEBUG EMAIL] Attention, refus partiel ou total : {refused}")
            server.quit()
        except smtplib.SMTPResponseException as e:
            logger.error(f"[EMAIL SERVICE ERROR] Rejet par Brevo - Code: {e.smtp_code}, Message exact: {e.smtp_error.decode('utf-8', 'ignore')}")
        except Exception as e:
            logger.error(f"[EMAIL SERVICE ERROR] Exception générale lors de l'envoi SMTP: {e}")
    else:
        # Mock en local
        logger.warning(f"=== [MOCK EMAIL SERVICE] ===")
        logger.warning(f"Sujet: STOP-ABOS — Réinitialisation de votre mot de passe")
        logger.warning(f"Destinataire: {to_email}")
        logger.warning(f"Le SMTP est désactivé. Voici le lien complet de réinitialisation :")
        logger.warning(f"{reset_link}")
        logger.warning(f"==============================")
