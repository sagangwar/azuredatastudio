# Azure Data Studio - Azure Connectivity guide

Azure Data Studio uses MSAL authentication library (by default) to acquire access token from Azure Active Directory. The settings that apply to Azure authentication are discussed below, along with commonly observed issues and their solutions.

## Azure: Authentication Library

This setting controls the authentication library used by Azure Data Studio when adding an Azure account. MSAL (Microsoft Authentication Library) offers authentication and authorization services using standard-compliant implementations of OAuth 2.0 and OpenID Connect (OIDC) 1.0. Read more about [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/azure/active-directory/develop/msal-overview).

`Settings.json`
```json
    "azure.authenticationLibrary": "MSAL"
```

<img src=".\Auth-Library.png" width='500' />

**ADAL (Active Directory Authentication Library)** is now deprecated, but is supported by Azure Data Studio as a fallback for any potential authentication issues with MSAL.

> !NOTE! Switching Authentication Library requires reloading Azure Data Studio. Existing Azure Accounts are marked stale and users must re-authenticate with the selected library.


## Azure Authentication Method

Azure Data Studio supports multi-factor authentication with Azure accounts using the following modes:

1. Using Code Grant authentication (enabled by default)
2. Using Device Code authentication


### Accounts > Azure > Auth: Code Grant

`Settings.json`
```json
    "accounts.azure.auth.codeGrant": true
```

<img src=".\Code-Grant.png" width='270' />

When 'Code Grant method' is checked, users will be prompted to authenticate with browser based authentication. This is enabled by default.


### Accounts > Azure > Auth: Device Code

`Settings.json`
```json
    "accounts.azure.auth.deviceCode": true
```
<img src=".\Device-Code.png" width='270' />

When 'Device Code method' is enabled, users will be provided with a code and a URL to enter which can then be used to login.

When both options are checked, users will be prompted to select one of the two authentication modes, when adding an Azure account.


## Azure Account Configuration

Azure Data Studio supports Azure AD authentication with National clouds. **Azure Public Cloud** is enabled by default, but users can enable other national clouds as needed:

`Settings.json`

```json
    "accounts.azure.cloud.enableChinaCloud": false,
    "accounts.azure.cloud.enableGermanyCloud": false,
    "accounts.azure.cloud.enablePublicCloud": true
    "accounts.azure.cloud.enableUsGovCloud": false,
    "accounts.azure.cloud.enableUsNatCloud": false,
```
<img src=".\National-Clouds.png" width='450' />

> !NOTE! Only one National Cloud can be enabled in a session.


## Azure Resource Configuration

These settings apply filters on Azure resources and tenants.
1. Resource Config filter: Applies inclusion filter to resources that should be displayed.
2. Tenant Config filter: Applies exclusion filter to tenants that should be ignored.

`Settings.json`

```json
    "azure.resource.config.filter": [],
    "azure.tenant.config.filter": [
		"313b5f9e-9b92-414c-8d87-a317e42d0222"
	]
```

<img src=".\Resource-Config.png" width='550' />


## Proxy setup for Azure Authentication

When using Azure Data Studio (ADS) behind a proxy, users must specify proxy settings in order for ADS to communicate with external endpoints. There are two ways to provide proxy settings for ADS to use:
1.  Setting proxy configuration in the Azure Data Studio (Settings > Http: Proxy Settings), or
2.  Setting environment variables for proxy configuration.

Azure Data Studio settings take precedence over environment variables.


### Azure Data Studio Proxy settings

The following settings are available in Azure Data Studio:

<img src=".\Proxy-settings.png" width="700" />

`Settings.json`
```json
	"http.proxy": "https://userName@fqdn:yourPassword@yourProxyURL.com:8080",
	"http.proxyStrictSSL": true,
	"http.proxyAuthorization": "",
	"http.proxySupport" : "override"
```


### Supported Environment variables for Proxy

- 'HTTP_PROXY' : 'http://userName@fqdn:yourPassword@yourProxyURL.com:8080'
- 'HTTPS_PROXY': 'https://userName@fqdn:yourPassword@yourProxyURL.com:8080'


### Whitelist URLs
In a proxy environment, user applications may need to allow specific domains used by Azure Data Studio. Listed below are hostnames through which you may need or want to allow communication:

**Azure Public**
- https://management.azure.com
- https://login.microsoftonline.com/

**Azure (US Government)**
- https://management.core.usgovcloudapi.net/
- https://login.microsoftonline.us/

**Azure (US National)**
- https://management.azure.eaglex.ic.gov/
- https://login.microsoftonline.eaglex.ic.gov/

**Azure (Germany)**
- https://management.microsoftazure.de/
- https://login.microsoftazure.de/

**Azure (China)**
- https://management.core.chinacloudapi.cn/
- https://login.partner.microsoftonline.cn/

The URLs to whitelist can sometimes vary on a case-by-case basis. In order to verify you aren’t blocking any URLs from going through, go to Help > Toggle Developer Tools and select the Network tab. Here you will see any URLs that are getting blocked that you may need to whitelist to successfully add your account.


## Common Authentication Issues

Possible issues and solutions when adding an Azure account are discussed below.


### Issue: SSL Error on localhost page (ERR_SSL_PROTOCOL_ERROR)

Users may see an SSL error when trying to login to their account. This flow opens an external web page to `localhost` which then normally prompts the user to log in via the standard Microsoft authentication prompts. The URL for this page will look something like this `http://localhost:50055/signin?nonce=...`

Some browsers may be set up to automatically redirect all `http` links to `https`, which will break this process as the local server serving the web page does not support https. If the link in the address bar starts with `https` then you will get an SSL error and the page will not load. In that case, listed below are workarounds which may address the issue.

**Change URL to http**

First, try manually changing the URL from https://... to http://.... The browser may change it back to https , in which case you will need to try another option.

**Disable HSTS (HTTP Strict Transport Security)**

For Edge/Chrome browsers you can disable [HSTS](https://www.chromium.org/hsts/) for localhost.

1. Open Edge/Chrome and in the address bar type `edge://net-internals/#hsts` (or `chrome://net-internals/#hsts` for Chrome)
2. Scroll to the bottom of the page and in the `Delete domain security policies` section enter `localhost` and press `Delete`

Once that is done you should be able to log in and not have the browser redirect your `localhost` links automatically to `https`


### Issue: Unable to add account behind proxy

If the user application is running in an environment behind a proxy, user authentication may not complete, and the steps below can be used to resolve the issue.

1. Recheck environment variables and `http.proxy` settings in ADS. If Proxy requires user authentication, providing username/password in `http.proxy` URL can resolve authentication issues, as otherwise, ADS is not capable of reading logged in user credentials. Alternatively, running ADS as a different user can be attempted, it may help resolve Authentication issues with Proxy. However, the latter is not a proved solution for all scenarios.

2. The URLs to whitelist can sometimes vary on a case-by-case basis. In order to verify you aren’t blocking any URLs from going through, go to `Help` > `Toggle Developer Tools` and select the `Network` tab.  Here you will see any URLs that are getting blocked that you may need to whitelist to successfully add your account.

3. Uncheck `Http: Proxy Strict SSL`. It's possible that proxy certificate is not verifiable against the list of trusted CAs. Disabling Strict SSL can rule out the proxy certificate as an issue.

**To conclude:**

As a cross-platform application, ADS proxy resolution fetches the proxy from either settings within the application, or through environment variables. The aim is to avoid interaction with system settings, which can vary greatly on different operating systems.


## Capturing logs for Azure authentication

Azure Data Studio captures "Error" events for Azure account activity by default. To enable more detailed traces, users can modify below settings:


### Azure: Logging Level

This setting configures the logging level for information from Azure core to be captured by Azure Data Studio. Change it to `Verbose` or `All` to capture detailed logs that can be useful to diagnose authentication failures.

`Settings.json`
```json
    "azure.loggingLevel": "Verbose"
```
<img src=".\logging-level.png" width="450" />


### Azure: Pii Logging

Users can enable Pii Logging for local testing and debugging purposes to capture personal identifiable information when authenticating with Azure. Because this logging captures sensitive information, it is not recommended to enable this setting when sharing logs to GitHub issues.

`Settings.json`
```json
    "azure.piiLogging": true
```
<img src=".\PiiLogging.png" width="800" />


## Azure: No System Keychain

This setting disables system keychain integration to prevent repeated keychain access prompts on macOS. User Credentials are alternatively stored in flat file in the user's home directory.

`Settings.json`
```json
    "azure.noSystemKeychain": true
```
<img src=".\keychain.png" width="600" />


## Clearing Azure Account token cache

Azure Data Studio maintains a cache of access tokens to prevent throttling of token requests to Azure AD. It is possible that Azure Data Studio's token cache is out of date, which requires cleaning up expired access tokens from the application cache.

User can make use of the Command below from **Command Palette (Ctrl + Shift + P)** to clear access tokens for linked Azure accounts:

`Azure Accounts: Clear Azure Account Token Cache (accounts.clearTokenCache)`


## Clearing all saved Azure Accounts

Running the command below from **Command Palette (Ctrl + Shift + P)** will remove all linked Azure Accounts from Azure Data Studio:

`Clear all saved accounts (clearSavedAccounts)`
