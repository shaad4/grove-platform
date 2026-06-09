def build_verification_email(display_name, verify_url):
    subject = "Verify your Grove account"

    # fallback plain text email
    text_content = f"""
    Hi {display_name},

    Welcome to Grove 🌿

    Verify your email address:

    {verify_url}

    This verification link expires in 24 hours.

    — The Grove Team
    """

    # beautiful HTML email
    html_content = f"""
    <!DOCTYPE html>
    <html>

    <head>
      <meta charset="UTF-8" />
      <title>Verify your Grove account</title>
    </head>

    <body style="
      margin:0;
      padding:0;
      background:#f4f7f5;
      font-family:Arial,sans-serif;
    ">

      <table
        width="100%"
        cellpadding="0"
        cellspacing="0"
      >
        <tr>
          <td
            align="center"
            style="padding:40px 20px;"
          >

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                max-width:600px;
                background:#ffffff;
                border-radius:28px;
                overflow:hidden;
                box-shadow:
                  0 20px 60px
                  rgba(15,123,95,0.08);
              "
            >

              <!-- HEADER -->
              <tr>
                <td
                  style="
                    background:#0f7b5f;
                    padding:44px;
                    text-align:center;
                  "
                >

                  <h1 style="
                    margin:0;
                    color:white;
                    font-size:38px;
                    font-weight:700;
                    letter-spacing:-1px;
                  ">
                    Grove 🌿
                  </h1>

                  <p style="
                    margin-top:12px;
                    color:rgba(255,255,255,0.82);
                    font-size:15px;
                  ">
                    Modern workspace management platform
                  </p>

                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:50px 42px;">

                  <h2 style="
                    margin:0;
                    color:#17352c;
                    font-size:30px;
                    font-weight:700;
                    letter-spacing:-0.5px;
                  ">
                    Verify your email
                  </h2>

                  <p style="
                    margin-top:20px;
                    color:#5f6f69;
                    font-size:16px;
                    line-height:1.8;
                  ">
                    Hi {display_name},
                    <br /><br />
                    Welcome to Grove.
                    You're one step away from launching
                    your workspace.
                  </p>

                  <!-- CTA -->
                  <table
                    cellpadding="0"
                    cellspacing="0"
                    style="margin-top:34px;"
                  >
                    <tr>
                      <td align="center">

                        <a
                          href="{verify_url}"
                          style="
                            display:inline-block;
                            background:#0f7b5f;
                            color:white;
                            text-decoration:none;
                            padding:16px 36px;
                            border-radius:16px;
                            font-size:15px;
                            font-weight:600;
                          "
                        >
                          Verify Email
                        </a>

                      </td>
                    </tr>
                  </table>

                  <!-- INFO BOX -->
                  <div style="
                    margin-top:42px;
                    padding:24px;
                    background:#f7faf8;
                    border-radius:20px;
                  ">

                    <p style="
                      margin:0;
                      color:#17352c;
                      font-size:15px;
                      font-weight:600;
                    ">
                      After verification you'll be able to:
                    </p>

                    <ul style="
                      margin-top:16px;
                      padding-left:20px;
                      color:#5f6f69;
                      font-size:14px;
                      line-height:2;
                    ">
                      <li>Create your branded workspace</li>
                      <li>Manage clients and projects</li>
                      <li>Automate workflows</li>
                      <li>Collaborate in real-time</li>
                    </ul>

                  </div>

                  <!-- EXPIRE -->
                  <p style="
                    margin-top:32px;
                    color:#74837d;
                    font-size:13px;
                    line-height:1.8;
                  ">
                    This verification link expires
                    in 24 hours for security reasons.
                  </p>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="
                  border-top:1px solid #edf2ef;
                  padding:28px 42px;
                  text-align:center;
                ">

                  <p style="
                    margin:0;
                    color:#97a39e;
                    font-size:13px;
                    line-height:1.8;
                  ">
                    If you didn’t create a Grove account,
                    you can safely ignore this email.
                  </p>

                  <p style="
                    margin-top:14px;
                    color:#97a39e;
                    font-size:12px;
                  ">
                    © 2026 Grove. All rights reserved.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
    """



    return {
        "subject": subject,
        "text_content": text_content,
        "html_content": html_content,
    }


def build_password_reset_email(display_name, reset_url):
    subject = "Reset your Grove password"

    text_content = f"""
    Hi {display_name},

    You requested a password reset for your Grove account.

    Reset your password here:
    {reset_url}

    This link expires in 30 minutes.

    If you didn't request this, ignore this email — your password won't change.

    — The Grove Team
    """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Reset your Grove password</title>
    </head>
    <body style="
      margin:0; padding:0;
      background:#f4f7f5;
      font-family:Arial,sans-serif;
    ">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="
              max-width:600px;
              background:#ffffff;
              border-radius:28px;
              overflow:hidden;
              box-shadow:0 20px 60px rgba(15,123,95,0.08);
            ">

              <!-- HEADER -->
              <tr>
                <td style="background:#0f7b5f; padding:44px; text-align:center;">
                  <h1 style="margin:0; color:white; font-size:38px; font-weight:700; letter-spacing:-1px;">
                    Grove 🌿
                  </h1>
                  <p style="margin-top:12px; color:rgba(255,255,255,0.82); font-size:15px;">
                    Modern workspace management platform
                  </p>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:50px 42px;">
                  <h2 style="margin:0; color:#17352c; font-size:30px; font-weight:700; letter-spacing:-0.5px;">
                    Reset your password
                  </h2>
                  <p style="margin-top:20px; color:#5f6f69; font-size:16px; line-height:1.8;">
                    Hi {display_name},<br /><br />
                    We received a request to reset your Grove password.
                    Click the button below — this link expires in 30 minutes.
                  </p>

                  <!-- CTA -->
                  <table cellpadding="0" cellspacing="0" style="margin-top:34px;">
                    <tr>
                      <td align="center">
                        <a href="{reset_url}" style="
                          display:inline-block;
                          background:#0f7b5f;
                          color:white;
                          text-decoration:none;
                          padding:16px 36px;
                          border-radius:16px;
                          font-size:15px;
                          font-weight:600;
                        ">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- EXPIRE -->
                  <p style="margin-top:32px; color:#74837d; font-size:13px; line-height:1.8;">
                    This link expires in 30 minutes for security reasons.<br />
                    If you didn't request a password reset, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="border-top:1px solid #edf2ef; padding:28px 42px; text-align:center;">
                  <p style="margin:0; color:#97a39e; font-size:13px; line-height:1.8;">
                    If you didn't request this, no action is needed.
                  </p>
                  <p style="margin-top:14px; color:#97a39e; font-size:12px;">
                    © 2026 Grove. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    return {
        "subject": subject,
        "text_content": text_content,
        "html_content": html_content,
    }


def build_notification_email(notif):
    subject = notif.title
    text_content = f"Hi {notif.recipient.display_name},\n\n{notif.body}\n\n— Grove"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:40px 0;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;
                  padding:40px;border:1px solid #E8EAE8;">
        <p style="font-size:20px;font-weight:600;color:#0F6E56;margin:0 0 24px;">Grove 🌿</p>
        <h2 style="font-size:18px;font-weight:500;color:#141A14;margin:0 0 12px;">
          {notif.title}
        </h2>
        <p style="font-size:14px;color:#4A544A;margin:0 0 32px;">{notif.body}</p>
        <hr style="border:none;border-top:1px solid #E8EAE8;margin:0 0 24px;" />
        <p style="font-size:12px;color:#9EA89E;margin:0;">
          You're receiving this because you were offline when the update came in.
        </p>
      </div>
    </body>
    </html>
    """

    return {
        "subject" : subject,
        "text_content" : text_content,
        "html_content" : html_content,
    }


def build_weekly_summary_email(
    display_name, tenant_name,
    requests_received, requests_delivered
):
    subject = f"Your Grove week — {tenant_name}"
    text_content = (
        f"Hi {display_name},\n\n"
        f"Here's your weekly summary for {tenant_name}:\n\n"
        f"  • Requests received: {requests_received}\n"
        f"  • Requests delivered: {requests_delivered}\n\n"
        f"Log in to see the full picture.\n\n— Grove"
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:40px 0;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;
                  padding:40px;border:1px solid #E8EAE8;">
        <p style="font-size:20px;font-weight:600;color:#0F6E56;margin:0 0 24px;">Grove 🌿</p>
        <h2 style="font-size:18px;font-weight:500;color:#141A14;margin:0 0 8px;">
          Your week at a glance
        </h2>
        <p style="font-size:13px;color:#9EA89E;margin:0 0 32px;">{tenant_name}</p>

        <div style="display:flex;gap:16px;margin-bottom:32px;">
          <div style="flex:1;background:#F7F8F7;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:28px;font-weight:600;color:#0F6E56;margin:0;">
              {requests_received}
            </p>
            <p style="font-size:12px;color:#9EA89E;margin:8px 0 0;">Received</p>
          </div>
          <div style="flex:1;background:#F7F8F7;border-radius:8px;padding:20px;text-align:center;">
            <p style="font-size:28px;font-weight:600;color:#0F6E56;margin:0;">
              {requests_delivered}
            </p>
            <p style="font-size:12px;color:#9EA89E;margin:8px 0 0;">Delivered</p>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid #E8EAE8;margin:0 0 24px;" />
        <p style="font-size:12px;color:#9EA89E;margin:0;">
          © 2026 Grove. You're receiving this as a workspace owner.
        </p>
      </div>
    </body>
    </html>
    """

    return {
        "subject" : subject,
        "text_content" : text_content,
        "html_content" : html_content,
    }