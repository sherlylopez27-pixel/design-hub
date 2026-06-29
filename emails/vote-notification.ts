interface VoteNotificationData {
  projectTitle: string
  voterName: string
  voterEmail: string
  optionTitle: string
  reason: string
  adminName: string
  projectUrl: string
}

export function voteNotificationHtml(data: VoteNotificationData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New vote on ${data.projectTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
      <tr><td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;text-align:center">
        <h1 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.025em">Design Hub</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px">New vote received</p>
      </td></tr>
      <tr><td style="padding:40px">
        <p style="margin:0 0 8px;color:#64748B;font-size:14px">Hi ${data.adminName},</p>
        <h2 style="margin:0 0 24px;color:#0F172A;font-size:22px;font-weight:700">${data.voterName} voted on <em>${data.projectTitle}</em></h2>
        <div style="background:#F1F5F9;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 4px;color:#64748B;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">They chose</p>
          <p style="margin:0;color:#4F46E5;font-size:18px;font-weight:700">${data.optionTitle}</p>
        </div>
        <div style="margin-bottom:24px">
          <p style="margin:0 0 4px;color:#64748B;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Their reason</p>
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;font-style:italic">"${data.reason}"</p>
        </div>
        <p style="margin:0 0 4px;color:#64748B;font-size:12px">From: <a href="mailto:${data.voterEmail}" style="color:#4F46E5">${data.voterEmail}</a></p>
        <div style="margin-top:32px;text-align:center">
          <a href="${data.projectUrl}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">View all results</a>
        </div>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #F1F5F9;text-align:center">
        <p style="margin:0;color:#94A3B8;font-size:12px">Design Hub — internal voting tool</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function voteNotificationText(data: VoteNotificationData): string {
  return `New vote on "${data.projectTitle}"

Hi ${data.adminName},

${data.voterName} (${data.voterEmail}) voted on "${data.projectTitle}".

They chose: ${data.optionTitle}

Their reason: "${data.reason}"

View results: ${data.projectUrl}

---
Design Hub — internal voting tool`
}
