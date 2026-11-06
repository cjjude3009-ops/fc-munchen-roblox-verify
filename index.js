const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FC MÜNCHEN Roblox verification is online!");
});

app.post("/verify", async (req, res) => {
  try {
    const { username, code } = req.body;

    if (!username || !code) {
      return res.status(400).json({
        verified: false,
        message: "Username and code are required."
      });
    }

    const lookup = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      }
    );

    if (!lookup.ok) {
      throw new Error("Roblox username lookup failed.");
    }

    const lookupData = await lookup.json();
    const user = lookupData.data?.[0];

    if (!user) {
      return res.json({
        verified: false,
        message: "Roblox username not found."
      });
    }

    const profileResponse = await fetch(
      `https://users.roblox.com/v1/users/${user.id}`
    );

    if (!profileResponse.ok) {
      throw new Error("Could not read Roblox profile.");
    }

    const profile = await profileResponse.json();

    const verified =
      typeof profile.description === "string" &&
      profile.description.includes(code);

    return res.json({
      verified,
      username: user.name,
      userId: user.id,
      message: verified
        ? "Roblox profile code found."
        : "Code not found in profile description."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      verified: false,
      message: "Verification service error."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FC MÜNCHEN verification running on port ${PORT}`);
});
