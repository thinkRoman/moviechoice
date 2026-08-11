/**
 * WhatsApp Business Cloud API client for MovieChoice.
 * Uses Meta's REST API directly — no SDK dependency.
 */

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_URL = 'https://graph.facebook.com';

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
}

function getConfig(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

export function whatsappConfigError(): string | null {
  if (!process.env.WHATSAPP_ACCESS_TOKEN) return 'WHATSAPP_ACCESS_TOKEN is not set.';
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) return 'WHATSAPP_PHONE_NUMBER_ID is not set.';
  return null;
}

/**
 * Send a template message via WhatsApp Business API.
 * Template must be pre-approved in Meta Business Suite.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: Array<{
    type: string;
    sub_type?: string;
    index: string;
    parameters: Array<{ type: string; text?: string; image?: { link: string } }>;
  }>,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: whatsappConfigError() || 'WhatsApp not configured' };
  }

  const cleanTo = to.replace(/[^\d+]/g, '');

  try {
    const response = await fetch(
      `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            ...(components && components.length ? { components } : {}),
          },
        }),
      },
    );

    const payload = await response.json() as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code: number };
    };

    if (!response.ok) {
      return {
        success: false,
        error: payload.error?.message || `WhatsApp API error (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: payload.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp send failed',
    };
  }
}

/**
 * Send a free-form text message via WhatsApp.
 * Only works within 24hr customer service window.
 */
export async function sendWhatsAppText(
  to: string,
  text: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: whatsappConfigError() || 'WhatsApp not configured' };
  }

  const cleanTo = to.replace(/[^\d+]/g, '');

  try {
    const response = await fetch(
      `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      },
    );

    const payload = await response.json() as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code: number };
    };

    if (!response.ok) {
      return {
        success: false,
        error: payload.error?.message || `WhatsApp API error (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: payload.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp send failed',
    };
  }
}

/**
 * Format a phone number from country code + number into E.164 format.
 * e.g. ('+1', '6505551234') → '+16505551234'
 */
export function formatWhatsAppNumber(countryCode: string, number: string): string {
  const clean = number.replace(/[^\d]/g, '');
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
  return `${code}${clean}`;
}
