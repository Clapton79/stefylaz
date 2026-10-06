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
