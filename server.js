const express = require("express");
const { createCanvas, loadImage } = require("canvas");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20mb" }));

const defaultAvatar = "https://i.ibb.co/qk0bnY8/placeholder.png";

// Helper: select best-fit background
async function selectBackground(canvasWidth, canvasHeight) {
  const bgFiles = [
    { path: "background_small.jpg", max: 1500 },
    { path: "background_medium.jpg", max: 2000 },
    { path: "background_large.jpg", max: 2500 },
    { path: "background_xl.jpg", max: 3000 }
  ];
  for (let bg of bgFiles) {
    if (canvasWidth <= bg.max || canvasHeight <= bg.max) {
      try {
        return await loadImage(bg.path);
      } catch {}
    }
  }
  return null; // fallback handled later
}

async function drawCircleImage(ctx, img, x, y, size, shadowColor = null) {
  if (shadowColor) {
    ctx.save();
    ctx.shadowColor = shadowColor;
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
  ctx.strokeStyle = shadowColor || "white";
  ctx.stroke();
  ctx.restore();

  if (shadowColor) ctx.restore();
}

app.post("/gcimg", async (req, res) => {
  try {
    const {
      groupName = "🌐 Group",
      groupPhotoURL = null,
      adminURLs = [],
      memberURLs = []
    } = req.body;

    // Dynamic height for canvas
    const canvasHeight = 400 + Math.ceil(adminURLs.length / 15) * 140 + Math.ceil(memberURLs.length / 15) * 110 + 300;
    const canvas = createCanvas(1800, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background
    const bgImg = await selectBackground(canvas.width, canvas.height);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = "#741414";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Group name
    ctx.save();
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 10;
    ctx.fillText(groupName, canvas.width / 2, 90);
    ctx.restore();

    // Group image
    if (groupPhotoURL) {
      try {
        const groupImg = await loadImage(groupPhotoURL);
        await drawCircleImage(ctx, groupImg, canvas.width / 2 - 100, 120, 200, "green");
      } catch (e) {
        console.log("Group photo fail:", e.message);
      }
    }

    // Admin label
    ctx.fillStyle = "red";
    ctx.font = "bold 40px Arial";
    ctx.fillText(`👑 Admins: ${adminURLs.length}`, canvas.width / 2, 360);

    // Draw admins
    let ax = 100, ay = 400, aSize = 100;
    for (let url of adminURLs) {
      try {
        const img = await loadImage(url || defaultAvatar);
        await drawCircleImage(ctx, img, ax, ay, aSize, "red");
      } catch {
        const fallback = await loadImage(defaultAvatar);
        await drawCircleImage(ctx, fallback, ax, ay, aSize, "red");
      }
      ax += aSize + 20;
      if (ax + aSize > canvas.width) {
        ax = 100;
        ay += aSize + 30;
      }
    }

    // Member label
    ctx.fillStyle = "red";
    ctx.font = "bold 40px Arial";
    ctx.fillText(`👥 Members: ${memberURLs.length}`, canvas.width / 2, ay + aSize + 50);

    // Draw members
    let mx = 100, my = ay + aSize + 80, mSize = 90;
    for (let url of memberURLs) {
      try {
        const img = await loadImage(url || defaultAvatar);
        await drawCircleImage(ctx, img, mx, my, mSize, "blue");
      } catch {
        const fallback = await loadImage(defaultAvatar);
        await drawCircleImage(ctx, fallback, mx, my, mSize, "blue");
      }
      mx += mSize + 20;
      if (mx + mSize > canvas.width) {
        mx = 100;
        my += mSize + 30;
      }
    }

    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ GC Image API running on port ${PORT}`));
