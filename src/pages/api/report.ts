export const prerender = false;
import type { APIRoute } from "astro";

const lastReportMap = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 60 detik

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const title = data.get("title") as string;
  const message = data.get("message") as string;
  const username = (data.get("username") as string) || "Anonymous";
  const severity = data.get("severity") as string;
  const file = data.get("screenshot") as File | null;
  const roleIds = ["1115808744647954562", "1115809109409804289"];
  const mentions = roleIds.map((id) => `<@&${id}>`).join(" ");

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";

  const now = Date.now();
  const lastTime = lastReportMap.get(ip) || 0;

  if (now - lastTime < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (now - lastTime)) / 1000);
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/cooldown?remaining=${remaining}`,
      },
    });
  }

  lastReportMap.set(ip, now);

  const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl)
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/error?message=Server configuration error",
      },
    });
  if (!title || !message || !severity)
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/error?message=Please fill in all required fields",
      },
    });

  const embed = {
    embeds: [
      {
        title: "⚠️New Error Reported⚠️",
        description: `**Title:** ${title}\n**Username: **${username}\n**Status Error:** ${severity}\n**Message:** ${message}\n\n**Tags: **📌${mentions}📌`,
        color:
          severity === "error"
            ? 16711680
            : severity === "bug"
            ? 16753920
            : severity === "page_not_found"
            ? 3447003
            : 65280,
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: {
      roles: roleIds,
    },
  };

  const discordForm = new FormData();
  discordForm.append("payload_json", JSON.stringify(embed));

  if (file) {
    const buffer = await file.arrayBuffer();
    discordForm.append("file", new Blob([buffer]), file.name);
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    body: discordForm,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Discord webhook failed:", text);
    return new Response(null, {
      status: 303,
      headers: {
        Location:
          "/error?message=Failed to send report. Please try again later.",
      },
    });
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/success",
    },
  });
};
