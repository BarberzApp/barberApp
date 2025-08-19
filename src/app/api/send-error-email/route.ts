import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, text } = await request.json()

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      return NextResponse.json(
        { error: 'Gmail credentials not configured' },
        { status: 500 }
      )
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html
    }

    console.log('Sending error email to:', to)
    await transporter.sendMail(mailOptions)
    console.log('Error email sent successfully')

    return NextResponse.json({ 
      success: true, 
      message: 'Error email sent successfully' 
    })
  } catch (error) {
    console.error('Error email sending failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send error email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}