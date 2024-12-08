
# Email Alias Manager for Cloudflare

A chromium-based browser extension to manage email aliases with Cloudflare's Email Routing API. This tool allows you to create, view, edit, and delete email aliases.

## Features

- **Create Aliases:** Define new email aliases and link them to destination email addresses.
- **View Aliases:** Display a list of all active aliases with their current settings.
- **Edit Aliases:** Modify the destination email address for existing aliases.
- **Enable/Disable Aliases:** Easily toggle the active status of each alias.
- **Delete Aliases:** Remove aliases you no longer need.
- **Configuration Panel:** Store and manage your Cloudflare API Key and Zone ID locally on your device.
- **Privacy First:** This extension only communicates with cloudflare's servers.

## How It Works

1. **Setup Configuration:**
    - First, you need to have a domain name managed by cloudflare, then you need to go to the [dashboard](https://dash.cloudflare.com/), click on your domain and search for its Zone ID
    - Then, you have to make a custom [API token](https://dash.cloudflare.com/profile/api-tokens) with the following characteristics:
        - Permissions:
	        - Zone
	        - Email Routing Rules
	        - Edit
		- Zone Resources:
			- Include
			- Specific zone
			- yourdomain.com
		- Client IP Filtering
			- Leave empty
		- TTL
			- If you'd like to give your token an expiry date (perhaps for security reasons), you can set it here.

2. **Manage Aliases:**
   - Use the "Create Alias" form to add new email aliases 
	   - If it is the first time you enter a destination address, you will need to verify it with an email sent to that address.
   - View and manage all aliases in the "View Aliases" section:
     - Enable/Disable aliases.
     - Edit destination email addresses.
     - Delete aliases.

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/email-alias-manager.git
   ```

2. Open Chrome and navigate to `chrome://extensions`.

3. Enable **Developer Mode** in the top right corner.

4. Click **Load unpacked** and select the folder containing this project.

## Usage

1. Open the extension in your Chrome toolbar.
2. Configure your Cloudflare API Key and Zone ID.
3. Start creating and managing your email aliases.

## Requirements

- A Cloudflare account with Email Routing enabled.
- API Key and Zone ID from Cloudflare.

## Contributions

Contributions, bug reports, and feature requests are welcome! Feel free to open an issue or submit a pull request.

## License

This project is licensed under the [GPL-3.0 license](LICENSE).

---

### Disclaimer

This tool relies on Cloudflare's Email Routing API. Ensure your API Key and Zone ID are kept secure. Use at your own risk.
