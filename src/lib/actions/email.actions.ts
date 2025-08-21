'use server';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Placeholder function to send an email.
 * In a real application, this would use an email service provider
 * like Nodemailer with SMTP, SendGrid, Mailgun, etc.
 */
export async function sendEmail(payload: EmailPayload) {
  console.log('--- SIMULATING EMAIL SEND ---');
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log('HTML Body:');
  console.log(payload.html.substring(0, 200) + '...'); // Log a snippet of the HTML
  console.log('-----------------------------');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In a real app, you would have error handling here based on the email service response
  return { success: true, message: 'Email sent successfully (simulated).' };
}
