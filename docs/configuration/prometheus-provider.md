# Prometheus Provider

## Overview

The `provider` section under the `prometheus` configuration specifies how the extension connects to a Prometheus server. It includes settings such as server address, TLS configuration, and custom headers.

## Example

```json
{
  "name": "default",
  "default": true,
  "address": "https://localhost:9090",
  "TLSConfig": {
    "insecure_skip_verify": true
  },
  "headers": {
    "Authorization": ["Bearer TOKEN"],
    "Accept": ["application/json"]
  }
}
```

## Fields

| Field                       | Description                                      | Required |
|-----------------------------|--------------------------------------------------|----------|
| `name`                      | Identifier for the provider.                     | Yes      |
| `default`                   | Set to `true` if this is the default provider.   | Yes      |
| `address`                   | URL of the Prometheus server.                    | Yes      |
| `TLSConfig.insecure_skip_verify` | Skip TLS verification.                      | No       |
| `headers`                   | Prometheus additional headers.                   | No       |
