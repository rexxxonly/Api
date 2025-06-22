
const express = require('express');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.post('/gcimg', async (req, res) => {
  try {
    const {
      groupName,
      groupPhotoURL,
      adminURLs,
      memberURLs,
      bgcolor = '#000000',
      color = '#ffffff',
      admincolor = '#ffff00',
      membercolor = '#00ffff',
      groupborderColor = '#00ff00',
      glow = false
    } = req.body;

    const canvas = createCanvas(1600, 1000);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Group name
    ctx.fillStyle = color;
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(groupName || "Group Image", canvas.width / 2, 70);

    // Group photo
    if (groupPhotoURL) {
      const groupImg = await loadImage(groupPhotoURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(100, 100, 70, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(groupImg, 30, 30, 140, 140);
      ctx.restore();

      ctx.strokeStyle = groupborderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(100, 100, 70, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Admin label
    ctx.fillStyle = admincolor;
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("🟡 Admin", 50, 220);

    for (let i = 0; i < adminURLs.length; i++) {
      const img = await loadImage(adminURLs[i]);
      const x = 160 + i * 130;
      const y = 180;
      ctx.drawImage(img, x, y, 100, 100);
    }

    // Member label
    ctx.fillStyle = membercolor;
    ctx.font = 'bold 30px Arial';
    ctx.fillText("🔵 Members", 50, 350);

    for (let i = 0; i < memberURLs.length && i < 20; i++) {
      const img = await loadImage(memberURLs[i]);
      const x = 160 + i * 120;
      const y = 310;
      ctx.drawImage(img, x, y, 90, 90);
    }

    const stream = canvas.createPNGStream();
    res.setHeader('Content-Type', 'image/png');
    stream.pipe(res);

  } catch (err) {
    console.error("🔥 Error in /gcimg:", err);
    res.status(500).json({ error: err.message || "Image creation failed" });
  }
});

app.listen(PORT, () => console.log(`✅ GCIMG API running on port ${PORT}`));
