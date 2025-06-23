
const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

const defaultAvatar = "https://i.ibb.co/qk0bnY8/placeholder.png";

function getSmartURL(avatarObj) {
  if (typeof avatarObj === "string") return avatarObj;
  return avatarObj.choto || avatarObj.bro || avatarObj.medium || defaultAvatar;
}

async function drawCircleImage(ctx, img, x, y, size, glow = false, glowColor = "cyan") {
  ctx.save();
  if (glow) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 50;
  }
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}

app.post("/gcimg", async (req, res) => {
  try {
    const {
      groupName,
      groupPhotoURL,
      adminURLs = [],
      memberURLs = [],
      bgcolor = "#000000",
      color = "#ffffff",
      admincolor = "yellow",
      membercolor = "red",
      groupborderColor = "green",
      glow = true
    } = req.body;

    const canvas = createCanvas(1800, 1200);
    const ctx = canvas.getContext("2d");

    // Background fill
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Group name text (no shadow)
    ctx.font = "bold 70px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(groupName || "Group", canvas.width / 2, 90);

    // Group image (circle with green glow)
    if (groupPhotoURL) {
      try {
        const groupImg = await loadImage(groupPhotoURL);
        await drawCircleImage(ctx, groupImg, canvas.width / 2 - 100, 110, 200, true, groupborderColor);
      } catch (e) {
        console.log("Group image error:", e.message);
      }
    }

    // Admin label (plain)
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
        console.log("Admin avatar error:", e.message);
      }
    }

    // Member label (red, no shadow)
    ctx.fillStyle = membercolor;
    ctx.font = "bold 36px Arial";
    ctx.fillText("ðŸ”µ Members", canvas.width / 2, ay + aSize + 50);

    // Member avatars
    let mx = 150, my = ay + aSize + 80, mSize = 90;
    for (let i = 0; i < memberURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(memberURLs[i]));
        await drawCircleImage(ctx, img, mx, my, mSize, glow, "red");
        mx += mSize + 25;
        if (mx + mSize > canvas.width) {
          mx = 150;
          my += mSize + 30;
        }
      } catch (e) {
        console.log("Member avatar error:", e.message);
      }
    }

    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);

  } catch (err) {
    console.error("âŒ API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`âœ… Final gcimg API running on port ${PORT}`));
