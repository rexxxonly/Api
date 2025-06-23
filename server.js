const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));

const defaultAvatar = "https://i.ibb.co/qk0bnY8/placeholder.png";

function getSmartURL(avatarObj) {
  if (typeof avatarObj === "string") return avatarObj;
  return avatarObj?.choto || avatarObj?.bro || avatarObj?.medium || defaultAvatar;
}

async function drawCircleImage(ctx, img, x, y, size, borderColor = "white", glow = false) {
  if (glow) {
    ctx.save();
    ctx.shadowColor = borderColor;
    ctx.shadowBlur = 20;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();

  if (glow) ctx.restore();
}

app.post("/gcimg", async (req, res) => {
  try {
    const {
      groupName = "🌐 Group",
      groupPhotoURL = null,
      adminURLs = [],
      memberURLs = [],
      bgcolor = "#741414",
      textcolor = "#ffffff",
      admincolor = "red",
      membercolor = "green",
      groupborderColor = "lime",
      glow = true
    } = req.body;

    // Dynamic canvas height based on member count
    const canvasHeight = 400 + Math.ceil(adminURLs.length / 15) * 140 + Math.ceil(memberURLs.length / 15) * 110 + 300;
    const canvas = createCanvas(1800, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background image if available
    try {
      const bg = await loadImage("background.jpg");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = bgcolor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Group name
    ctx.save();
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = textcolor;
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.fillText(groupName, canvas.width / 2, 90);
    ctx.restore();

    // Group Image
    if (groupPhotoURL) {
      try {
        const groupImg = await loadImage(groupPhotoURL);
        await drawCircleImage(ctx, groupImg, canvas.width / 2 - 100, 120, 200, groupborderColor, true);
      } catch (e) {
        console.log("Group photo failed:", e.message);
      }
    }

    // Admin Section Label
    ctx.fillStyle = admincolor;
    ctx.font = "bold 40px Arial";
    ctx.fillText(`👑 Admins: ${adminURLs.length}`, canvas.width / 2, 360);

    // Draw Admin Avatars
    let ax = 100, ay = 400, aSize = 100;
    for (let i = 0; i < adminURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(adminURLs[i]));
        await drawCircleImage(ctx, img, ax, ay, aSize, admincolor, glow);
      } catch {
        const fallback = await loadImage(defaultAvatar);
        await drawCircleImage(ctx, fallback, ax, ay, aSize, admincolor, glow);
      }
      ax += aSize + 20;
      if (ax + aSize > canvas.width) {
        ax = 100;
        ay += aSize + 30;
      }
    }

    // Member Section Label
    ctx.fillStyle = membercolor;
    ctx.font = "bold 40px Arial";
    ctx.fillText(`👥 Members: ${memberURLs.length}`, canvas.width / 2, ay + aSize + 50);

    // Draw Member Avatars
    let mx = 100, my = ay + aSize + 80, mSize = 90;
    for (let i = 0; i < memberURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(memberURLs[i]));
        await drawCircleImage(ctx, img, mx, my, mSize, membercolor, false);
      } catch {
        const fallback = await loadImage(defaultAvatar);
        await drawCircleImage(ctx, fallback, mx, my, mSize, membercolor, false);
      }
      mx += mSize + 20;
      if (mx + mSize > canvas.width) {
        mx = 100;
        my += mSize + 30;
      }
    }

    // Return PNG stream
    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ GC Image API running on port ${PORT}`));
