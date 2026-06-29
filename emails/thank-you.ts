interface ThankYouData {
  voterName: string
  projectTitle: string
  optionTitle: string
  openVotesUrl: string
}

export function thankYouHtml(data: ThankYouData): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Thanks for voting!</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
      <tr><td style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 40px;text-align:center">
        <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center">
          <span style="font-size:28px">✓</span>
        </div>
        <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:700;letter-spacing:-0.025em">Vote recorded!</h1>
      </td></tr>
      <tr><td style="padding:40px;text-align:center">
        <p style="margin:0 0 16px;color:#334155;font-size:16px">Hi ${data.voterName},</p>
        <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.6">
          Your vote for <strong style="color:#4F46E5">${data.optionTitle}</strong> on <strong>${data.projectTitle}</strong> has been recorded.
        </p>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin-bottom:32px">
          <p style="margin:0;color:#166534;font-size:14px;font-weight:500">That's your one vote — it's locked in.</p>
        </div>
        <a href="${data.openVotesUrl}" style="display:inline-block;background:#4F46E5;color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">See other open votes</a>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #F1F5F9;text-align:center">
        <p style="margin:0;color:#94A3B8;font-size:12px">Design Hub — your name and email are shared only with the team running this vote.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

export function thankYouText(data: ThankYouData): string {
  return `Thanks for voting, ${data.voterName}!

Your vote for "${data.optionTitle}" on "${data.projectTitle}" has been recorded.

That's your one vote — it's locked in.

See other open votes: ${data.openVotesUrl}

---
Your name and email are shared only with the team running this vote.`
}
