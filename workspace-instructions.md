# simpsonm09 personal working agreements
- The organization layer's agreements apply first. This layer adds personal services and settings.
- Reach brokered services through the documented wrapper, with the agent role. Never put a service token in the environment or an agent-facing config file.
- Load the matching skill before using a personal integration: `agent-vault` for identities, bundles, and proxies; `dev-tools` for tool settings; `integrations-personal` and `discord` for those services. Do not guess a command or an identity.
- Committed files hold variable names and general rules only. Credentials and personal or machine data stay out of the repository.
- Tool installation belongs to the machine setup repository, not to this layer.
