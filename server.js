
const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

const defaultAvatar = "https://i.ibb.co/qk0bnY8/placeholder.png";

function getSmartURL(avatarObj) {
  if (typeof avatarObj === "string") return avatarObj;
  return avatarObj.choto || avatarObj.bro || avatarObj.medium || defaultAvatar;
}

async function drawCircleImage(ctx, img, x, y, size, glow = false, glowColor = "cyan") {
  if (glow) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();

  if (glow) ctx.restore();
}

app.post("/gcimg", async (req, res) => {
  try {
    const {
      groupName,
      groupPhotoURL,
      adminURLs = [],
      memberURLs = [],
      bgcolor = "#000",
      color = "#fff",
      admincolor = "yellow",
      membercolor = "red",
      groupborderColor = "lime",
      glow = true
    } = req.body;

    const canvas = createCanvas(1800, 1200);
    const ctx = canvas.getContext("2d");

    // Background image or fill
    try {
      const bg = await loadImage("background.jpg");
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    } catch {
      ctx.fillStyle = bgcolor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Group name with shadow
    ctx.save();
    ctx.font = "bold 70px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillText(groupName || "Group", canvas.width / 2, 90);
    ctx.restore();

    // Group photo in circle
    if (groupPhotoURL) {
      try {
        const groupImg = await loadImage(groupPhotoURL);
        await drawCircleImage(ctx, groupImg, canvas.width / 2 - 100, 110, 200, true, "lime");
      } catch (e) {
        console.log("Group img failed", e.message);
      }
    }

    // Admin label
    ctx.fillStyle = admincolor;
    ctx.font = "bold 36px Arial";
    ctx.fillText("ðŸŸ¡ Admin", canvas.width / 2, 360);

    // Admin avatars
    let ax = 150, ay = 400, aSize = 100;
    for (let i = 0; i < adminURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(adminURLs[i]));
        await drawCircleImage(ctx, img, ax, ay, aSize, glow, "yellow");
        ax += aSize + 30;
        if (ax + aSize > canvas.width) {
          ax = 150;
          ay += aSize + 30;
        }
      } catch (e) {
        console.log("Admin avatar fail:", e.message);
      }
    }

    // Members label in red
    ctx.fillStyle = membercolor;
    ctx.font = "bold 36px Arial";
    ctx.fillText("ðŸ”µ Members", canvas.width / 2, ay + aSize + 50);

    // Member avatars
    let mx = 150, my = ay + aSize + 80, mSize = 90;
    for (let i = 0; i < memberURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(memberURLs[i]));
        await drawCircleImage(ctx, img, mx, my, mSize, glow, "skyblue");
        mx += mSize + 25;
        if (mx + mSize > canvas.width) {
          mx = 150;
          my += mSize + 30;
        }
      } catch (e) {
        console.log("Member avatar fail:", e.message);
      }
    }

    // Output PNG
    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);

  } catch (err) {
    console.error("âŒ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`ðŸŽ¨ gcimg beautified API running on port ${PORT}`));
