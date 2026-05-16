import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { record } = await req.json()

    console.log("=== KATEGORIEN WEBHOOK GESTARTET ===")
    console.log("Neue Kategorie (record):", JSON.stringify(record))

    const orgId = record.organization_id
    if (!orgId) {
      throw new Error("Die erstellte Kategorie hat keine organization_id. Abbruch.")
    }

    // Holt alle User dieser Organisation mit aktivem Slider
    const { data: activeUsers, error: usersError } = await supabaseAdmin
      .from('user_settings')
      .select('id')
      .eq('organization_id', orgId)
      .eq('notify_protocols', true) 

    if (usersError || !activeUsers || activeUsers.length === 0) {
      console.log(`Keine Benachrichtigungen zu senden für neue Kategorien in Organisation ${orgId}.`);
      return new Response(JSON.stringify({ message: 'Keine aktiven Empfänger gefunden.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const categoryTitle = record.name || record.title || 'Unbenannte Kategorie'
    console.log(`${activeUsers.length} Empfänger für Kategorien-Benachrichtigung gefunden. Löse E-Mails auf...`)

    for (const userSetting of activeUsers) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userSetting.id)
        
        if (userError || !userData?.user?.email) {
          console.error(`Konnte Mail für User-ID ${userSetting.id} nicht finden, überspringe.`);
          continue;
        }

        const userEmail = userData.user.email

        // Mail via Resend senden
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Protokoll-Manager <onboarding@resend.dev>', // Nach Verifizierung: 'AJV App <buero@ajv-elektro.de>'
            to: [userEmail],
            subject: `📁 Neue Kategorie angelegt: ${categoryTitle}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #1a202c;">
                <h2 style="color: #2b6cb0;">Eine neue Kategorie wurde erstellt</h2>
                <p>Hallo,</p>
                <p>in deinem Unternehmensumfeld wurde eine neue Kategorie für Protokolle bzw. Vorlagen hinzugefügt:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Name der Kategorie:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${categoryTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Erstellt am:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString('de-DE')}</td>
                  </tr>
                </table>
                <p style="font-size: 12px; color: #718096; margin-top: 30px;">
                  Du erhältst diese Nachricht, da du Benachrichtigungen für dein Team in den App-Einstellungen aktiviert hast.
                </p>
              </div>
            `,
          }),
        })
        console.log(`Erfolgreich gesendet an: ${userEmail}`)
      } catch (innerErr) {
        console.error(`Fehler beim Senden an User ${userSetting.id}:`, innerErr.message)
      }
    }

    return new Response(JSON.stringify({ success: true, recipients: activeUsers.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("Kritischer Fehler im Kategorien-Webhook:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})