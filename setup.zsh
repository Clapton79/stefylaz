#!/bin/zsh

# Exit immediately if any command fails
set -e

print -P "%F{magenta}💒 Initializing your Azure + Hugo Wedding Architecture...%f"

# 1. Initialize Hugo site structure
hugo new site . --format toml --force

# 2. Set up Git and add a clean, responsive wedding theme
git init
git submodule add https://github.com themes/hugo-wedding-theme || true

# 3. Create the Hugo Config file (hugo.toml)
cat << 'EOF' > hugo.toml
baseURL = 'https://your-wedding-site.com'
languageCode = 'en-us'
title = 'Alex & Sam - Our Wedding 2027'
theme = 'hugo-wedding-theme'

[params]
    weddingDate = "2027-09-18T16:00:00"
    venueName = "The Grand Garden, Frankfurt"
    contactEmail = "ourwedding@example.com"
EOF

# 4. Create the Frontend RSVP page content
mkdir -p content
cat << 'EOF' > content/rsvp.md
---
title: "Kindly Reply (RSVP)"
date: 2026-10-06
layout: "rsvp"
---

Please let us know if you can make it to our special day by **May 1st, 2027**.

<form id="wedding-rsvp-form" onsubmit="submitRSVP(event)" style="max-width: 400px; margin: 20px 0;">
    <div style="margin-bottom: 15px;">
        <label for="guestName" style="display:block; font-weight:bold;">Full Name:</label>
        <input type="text" id="guestName" required placeholder="e.g., Jane Doe" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
    </div>

    <div style="margin-bottom: 15px;">
        <label for="attending" style="display:block; font-weight:bold;">Will you attend?</label>
        <select id="attending" required style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <option value="true">✅ Joyfully Accept</option>
            <option value="false">❌ Regretfully Decline</option>
        </select>
    </div>

    <div style="margin-bottom: 15px;">
        <label for="dietary" style="display:block; font-weight:bold;">Dietary Restrictions / Notes:</label>
        <textarea id="dietary" placeholder="e.g., Vegetarian, Allergies..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; height:8px; min-height:60px;"></textarea>
    </div>

    <button type="submit" style="background:#4A5568; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Submit RSVP</button>
</form>

<div id="form-response" style="margin-top: 15px; font-weight: bold;"></div>

<script>
async function submitRSVP(event) {
    event.preventDefault();
    const responseDiv = document.getElementById('form-response');
    responseDiv.style.color = "black";
    responseDiv.innerText = "Sending your response...";

    const payload = {
        guestName: document.getElementById('guestName').value,
        attending: document.getElementById('attending').value === "true",
        dietaryRequirements: document.getElementById('dietary').value
    };

    try {
        const response = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            responseDiv.style.color = "green";
            responseDiv.innerText = "❤️ Thank you! Your RSVP has been received.";
            document.getElementById('wedding-rsvp-form').reset();
        } else {
            throw new Error('Server returned an error status.');
        }
    } catch (error) {
        responseDiv.style.color = "red";
        responseDiv.innerText = "⚠️ Oops! Something went wrong. Please try again.";
    }
}
</script>
EOF

print -P "%F{green}✅ Frontend Hugo files built successfully!%f"

# 5. Build out the Managed Azure Functions API Structure
print -P "%F{magenta}⚙️ Setting up the Azure Functions Backend API...%f"
mkdir -p api/rsvp

# Create host file for local Azure Functions core tools runtime
cat << 'EOF' > api/host.json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
EOF

# Create package.json inside the api root directory
cat << 'EOF' > api/package.json
{
  "name": "wedding-api",
  "version": "1.0.0",
  "description": "Azure function backend for processing wedding site RSVPs",
  "dependencies": {
    "@azure/communication-email": "^1.0.0"
  }
}
EOF

# Create function configuration binding definitions
cat << 'EOF' > api/rsvp/function.json
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
EOF

# Create the primary JavaScript email trigger function code
cat << 'EOF' > api/rsvp/index.js
const { EmailClient } = require("@azure/communication-email");

const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;

module.exports = async function (context, req) {
    if (!connectionString) {
        context.log.error("Missing configuration connection string.");
        context.res = { status: 500, body: "API configuration missing." };
        return;
    }

    const { guestName, attending, dietaryRequirements } = req.body || {};

    if (!guestName) {
        context.res = { status: 400, body: "Missing guest name." };
        return;
    }

    const emailClient = new EmailClient(connectionString);
    const emailMessage = {
        senderAddress: "donotreply@your-azure-allocated-id.azurecomm.net", // Managed by your ACS instance
        content: {
            subject: `💒 New RSVP: ${guestName}`,
            plainText: `${guestName} has responded: ${attending ? "Attending" : "Not Attending"}.\nDietary needs: ${dietaryRequirements || "None"}`,
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #4A5568;">New Wedding RSVP Received!</h2>
                        <hr>
                        <p><strong>Guest Name:</strong> ${guestName}</p>
                        <p><strong>Status:</strong> ${attending ? "✅ Joyfully Accepts" : "❌ Regretfully Declines"}</p>
                        <p><strong>Dietary / Message notes:</strong> ${dietaryRequirements || "None specified"}</p>
                    </body>
                </html>`
        },
        recipients: {
            to: [{ address: "your-personal-email@gmail.com", displayName: "Wedding Planner" }]
        }
    };

    try {
        const poller = await emailClient.beginSend(emailMessage);
        await poller.pollUntilDone();

        context.res = {
            status: 200,
            body: { success: true, message: "RSVP tracked and mail alert issued!" }
        };
    } catch (error) {
        context.log.error("ACS Email service error occurred:", error);
        context.res = { status: 500, body: "Error occurred processing email alert notification." };
    }
};
