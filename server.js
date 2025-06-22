const express = require("express");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));

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
      membercolor = "skyblue"
    } = req.body;

    const canvas = createCanvas(1600, 1000);
    const ctx = canvas.getContext("2d");

    // Load background image
    const background = await loadImage("https://cdn.discordapp.com/attachments/1386056360373784609/1386274747838496828/20250622_145609.png?ex=68591c77&is=6857caf7&hm=6e324c9a849d11d15310aac5417c7d2dd9266af0faf23305bca58f4a3b27cfd8&");
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Group Name
    ctx.fillStyle = color;
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText(groupName || "Group", canvas.width / 2, 80);

    // Group Photo (top-left)
    if (groupPhotoURL) {
      const g = await loadImage(groupPhotoURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 120, 70, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(g, 50, 50, 140, 140);
      ctx.restore();
    }

    // Admin label
    ctx.fillStyle = admincolor;
    ctx.font = "bold 32px Arial";
    ctx.fillText("🟡 Admin", canvas.width / 2, 200);

    // Admin avatars
    for (let i = 0; i < adminURLs.length && i < 10; i++) {
      const img = await loadImage(adminURLs[i]);
      const x = 400 + i * 110;
      const y = 240;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 40, y + 40, 40, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, 80, 80);
      ctx.restore();
    }

    // Member label
    ctx.fillStyle = membercolor;
    ctx.font = "bold 32px Arial";
    ctx.fillText("🔵 Members", canvas.width / 2, 420);

    // Member avatars
    for (let i = 0; i < memberURLs.length && i < 10; i++) {
      const img = await loadImage(memberURLs[i]);
      const x = 300 + i * 100;
      const y = 460;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + 35, y + 35, 35, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x, y, 70, 70);
      ctx.restore();
    }

    // Output the image
    const stream = canvas.createPNGStream();
    res.setHeader("Content-Type", "image/png");
    stream.pipe(res);

  } catch (err) {
    console.error("❌ API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ gcimg API running on port ${PORT}`));
