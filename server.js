
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

async function drawCircleImage(ctx, img, x, y, size, glow = false) {
  if (glow) {
    ctx.save();
    ctx.shadowColor = "cyan";
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
      membercolor = "skyblue",
      glow = true
    } = req.body;

    const canvas = createCanvas(1800, 1200);
    const ctx = canvas.getContext("2d");

    // Background Image
    const bg = await loadImage("background.jpg");
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // Group name
    ctx.fillStyle = color;
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(groupName || "Group", canvas.width / 2, 80);

    // Group photo
    if (groupPhotoURL) {
      const g = await loadImage(groupPhotoURL);
      ctx.drawImage(g, canvas.width / 2 - 100, 100, 200, 200);
    }

    // Admin label
    ctx.fillStyle = admincolor;
    ctx.font = "bold 36px Arial";
    ctx.fillText("ðŸŸ¡ Admin", canvas.width / 2, 350);

    // Admin avatars
    let ax = 150, ay = 390, aSize = 100;
    for (let i = 0; i < adminURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(adminURLs[i]));
        await drawCircleImage(ctx, img, ax, ay, aSize, glow);
        ax += aSize + 30;
        if (ax + aSize > canvas.width) {
          ax = 150;
          ay += aSize + 30;
        }
      } catch (e) {
        console.log("Admin img load fail:", e.message);
      }
    }

    // Member label
    ctx.fillStyle = membercolor;
    ctx.font = "bold 36px Arial";
    ctx.fillText("ðŸ”µ Members", canvas.width / 2, ay + aSize + 50);

    // Member avatars
    let mx = 150, my = ay + aSize + 80, mSize = 90;
    for (let i = 0; i < memberURLs.length; i++) {
      try {
        const img = await loadImage(getSmartURL(memberURLs[i]));
        await drawCircleImage(ctx, img, mx, my, mSize, glow);
        mx += mSize + 25;
        if (mx + mSize > canvas.width) {
          mx = 150;
          my += mSize + 30;
        }
      } catch (e) {
        console.log("Member img load fail:", e.message);
      }
    }

    // Output image
    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);

  } catch (err) {
    console.error("âŒ API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`âœ… gcimg API running on port ${PORT}`));
