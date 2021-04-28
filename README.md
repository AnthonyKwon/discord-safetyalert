# Usage
Copy `config/settings.json.example` to `config/settings.json` and edit as your own.  
Start with command `npm run prod`, `npm run production` or `npm start`.  

# Channel Priority Settings
If bot find the matching guild in the **guild-channel map**(`guilds.json`),  
bot will try to send message first to the channel in the **map**.  

### How to use
Create `config/guilds.json` file and fill as below.  
```
{
    "guild-id": channel-id,
    "guild-id": channel-id,
    ...
}
```
