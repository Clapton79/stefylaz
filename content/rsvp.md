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
