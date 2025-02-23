"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Copy, FileJson, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const StackGenerator = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    n8nEditorDomain: "",
    n8nWebhookDomain: "",
    difyDomain: "",
    evolutionDomain: "",
    minioDomain: "",
    minioConsoleDomain: "",
    redisPassword: "",
    postgresPassword: "",
    encryptionKey: "",
    minioRootUser: "admin",
    minioRootPassword: "",
    evolutionApiKey: "",
  })

  const [copyFeedback, setCopyFeedback] = useState("")
  const [copied, setCopied] = useState({
    redis: false,
    postgres: false,
    encryption: false,
    minioRootPassword: false,
    evolutionApiKey: false,
    dbStack: false,
    n8nStack: false,
    difyStack: false,
    evolutionStack: false,
    minioStack: false,
    summary: false,
    dbEvolutionStack: false,
    allStacks: false,
  })

  const generateRandomString = useRef(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  }).current

  const generatePasswords = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      redisPassword: generateRandomString(),
      postgresPassword: generateRandomString(),
      encryptionKey: generateRandomString(),
      minioRootPassword: generateRandomString(),
      evolutionApiKey: generateRandomString(),
    }))
  }, [generateRandomString])

  useEffect(() => {
    generatePasswords()
  }, [generatePasswords])

  const generateDbStack = () => {
    return JSON.stringify(
      {
        services: [
          {
            type: "postgres",
            data: {
              projectName: formData.projectName,
              serviceName: `${formData.projectName}_postgres`,
              image: "postgres:16",
              password: formData.postgresPassword,
            },
          },
          {
            type: "redis",
            data: {
              projectName: formData.projectName,
              serviceName: `${formData.projectName}_redis`,
              image: "redis:7",
              password: formData.redisPassword,
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateDbEvolutionStack = () => {
    return JSON.stringify(
      {
        services: [
          {
            type: "postgres",
            data: {
              projectName: formData.projectName,
              serviceName: `evolution_postgres`,
              image: "postgres:16",
              password: formData.postgresPassword,
            },
          },
          {
            type: "redis",
            data: {
              projectName: formData.projectName,
              serviceName: `evolution_redis`,
              image: "redis:7",
              password: formData.redisPassword,
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateN8nStack = () => {
    const baseEnv = `DB_POSTGRESDB_DATABASE=${formData.projectName}
DB_POSTGRESDB_HOST=${formData.projectName}_postgres
DB_POSTGRESDB_PASSWORD=${formData.postgresPassword}
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_USER=postgres
DB_TYPE=postgresdb
QUEUE_BULL_REDIS_HOST=${formData.projectName}_redis
QUEUE_BULL_REDIS_PASSWORD=${formData.redisPassword}
QUEUE_BULL_REDIS_PORT=6379
EXECUTIONS_MODE=queue
EXECUTIONS_DATA_MAX_AGE=336
EXECUTIONS_DATA_PRUNE=true
GENERIC_TIMEZONE=America/Sao_Paulo
N8N_DIAGNOSTICS_ENABLED=false
N8N_EDITOR_BASE_URL=https://${formData.n8nEditorDomain}/
N8N_ENCRYPTION_KEY=${formData.encryptionKey}
N8N_HOST=${formData.n8nEditorDomain}/
N8N_PROTOCOL=https
NODE_ENV=production
NODE_FUNCTION_ALLOW_EXTERNAL=moment,lodash,moment-with-locales
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=file,console
N8N_LOG_FILE_LOCATION=/home/node/.n8n/logs/n8n-01.log
TZ=America/Sao_Paulo
WEBHOOK_URL=https://${formData.n8nWebhookDomain}/
S3_ENABLED=true
S3_ACCESS_KEY=${formData.minioRootUser}
S3_SECRET_KEY=${formData.minioRootPassword}
S3_BUCKET=n8n
S3_PORT=9000
S3_ENDPOINT=${formData.minioDomain}
S3_REGION=us-east-1
S3_USE_SSL=true`

    return JSON.stringify(
      {
        services: [
          {
            type: "app",
            data: {
              projectName: formData.projectName,
              serviceName: "n8n_editor",
              source: { type: "image", image: "n8nio/n8n:latest" },
              env: baseEnv,
              deploy: { replicas: 1, command: "n8n start", zeroDowntime: true },
              domains: [{ host: formData.n8nEditorDomain, https: true, port: 5678 }],
              mounts: [{ type: "volume", name: "n8n-data", mountPath: "/home/node/.n8n" }],
            },
          },
          {
            type: "app",
            data: {
              projectName: formData.projectName,
              serviceName: "n8n_webhook",
              source: { type: "image", image: "n8nio/n8n:latest" },
              env: baseEnv,
              deploy: { replicas: 1, command: "n8n webhook", zeroDowntime: true },
              domains: [{ host: formData.n8nWebhookDomain, https: true, port: 5678 }],
              mounts: [{ type: "volume", name: "n8n-data", mountPath: "/home/node/.n8n" }],
            },
          },
          {
            type: "app",
            data: {
              projectName: formData.projectName,
              serviceName: "n8n_worker",
              source: { type: "image", image: "n8nio/n8n:latest" },
              env: baseEnv,
              deploy: { replicas: 1, command: "n8n worker --concurrency=5", zeroDowntime: true },
              mounts: [{ type: "volume", name: "n8n-data", mountPath: "/home/node/.n8n" }],
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateDifyStack = () => {
    return JSON.stringify(
      {
        services: [
          {
            type: "compose",
            data: {
              serviceName: "dify",
              source: {
                type: "git",
                repo: "https://github.com/easypanel-io/compose.git",
                ref: "30-01-2025",
                rootPath: "/dify/code",
                composeFile: "docker-compose.yaml",
              },
              env: `S3_ENABLED=true
S3_ACCESS_KEY=${formData.minioRootUser}
S3_SECRET_KEY=${formData.minioRootPassword}
S3_BUCKET=dify
S3_ENDPOINT=https://${formData.minioDomain}
S3_REGION=us-east-1`,
              domains: [{ host: formData.difyDomain, port: 80, service: "nginx" }],
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateEvolutionStack = () => {
    const baseEnv = `SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=https://${formData.evolutionDomain}
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgres://postgres:${formData.postgresPassword}@evolution_postgres:5432/${formData.projectName}
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://default:${formData.redisPassword}@evolution_redis:6379
S3_ENABLED=true
S3_ACCESS_KEY=${formData.minioRootUser}
S3_SECRET_KEY=${formData.minioRootPassword}
S3_BUCKET=evolution
S3_PORT=9000
S3_ENDPOINT=${formData.minioDomain}
S3_REGION=us-east-1
S3_USE_SSL=true
AUTHENTICATION_API_KEY=${formData.evolutionApiKey}`

    return JSON.stringify(
      {
        services: [
          {
            type: "app",
            data: {
              serviceName: "evolution-api",
              env: baseEnv,
              source: { type: "image", image: "atendai/evolution-api:v2.2.3" },
              domains: [{ host: formData.evolutionDomain, port: 8080 }],
              mounts: [{ type: "volume", name: "evolution-instances", mountPath: "/evolution/instances" }],
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateMinioStack = () => {
    return JSON.stringify(
      {
        services: [
          {
            type: "app",
            data: {
              serviceName: "minio",
              env: `MINIO_SERVER_URL=https://${formData.minioDomain}
MINIO_ROOT_USER=${formData.minioRootUser}
MINIO_ROOT_PASSWORD=${formData.minioRootPassword}`,
              source: { type: "image", image: "minio/minio:latest" },
              mounts: [{ type: "volume", name: "minio-data", mountPath: "/data" }],
              domains: [
                { host: formData.minioConsoleDomain, port: 9001 },
                { host: formData.minioDomain, port: 9000 },
              ],
              deploy: { command: 'minio server /data --console-address ":9001"' },
            },
          },
        ],
      },
      null,
      2,
    )
  }

  const generateAllStacks = () => {
    return JSON.stringify(
      {
        services: [
          ...JSON.parse(generateDbStack()).services,
          ...JSON.parse(generateDbEvolutionStack()).services,
          ...JSON.parse(generateN8nStack()).services,
          ...JSON.parse(generateDifyStack()).services,
          ...JSON.parse(generateEvolutionStack()).services,
          ...JSON.parse(generateMinioStack()).services,
        ],
      },
      null,
      2,
    )
  }

  const generateMarkdownSummary = () => {
    return `# Stack Configuration Summary

## Project Details
- Project Name: ${formData.projectName}
- N8n Editor Domain: ${formData.n8nEditorDomain}
- N8n Webhook Domain: ${formData.n8nWebhookDomain}
- Dify Domain: ${formData.difyDomain}
- Evolution Domain: ${formData.evolutionDomain}
- MinIO Domain: ${formData.minioDomain}
- MinIO Console Domain: ${formData.minioConsoleDomain}

## Credentials
- Redis Password: ${formData.redisPassword}
- PostgreSQL Password: ${formData.postgresPassword}
- N8N Encryption Key: ${formData.encryptionKey}
- MinIO Root User: ${formData.minioRootUser}
- MinIO Root Password: ${formData.minioRootPassword}
- Evolution API Key: ${formData.evolutionApiKey}

## Stack Components
1. PostgreSQL Database (postgres:16)
2. Redis (redis:7)
3. N8n Stack (Editor, Webhook, Worker)
4. Dify Stack
5. Evolution API
6. MinIO S3 Storage

## S3 Integration
- All services configured to use MinIO as S3 storage
- Buckets: n8n, dify, evolution`
  }

  const copyToClipboard = async (text, type, description) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied((prev) => ({ ...prev, [type]: true }))
      setCopyFeedback(`${description} copiado com sucesso!`)
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [type]: false }))
        setCopyFeedback("")
      }, 2000)
    } catch (err) {
      setCopyFeedback("Erro ao copiar. Tente novamente.")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stack Generator for Easypanel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n8nEditorDomain">N8n Editor Domain</Label>
              <Input
                id="n8nEditorDomain"
                value={formData.n8nEditorDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, n8nEditorDomain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n8nWebhookDomain">N8n Webhook Domain</Label>
              <Input
                id="n8nWebhookDomain"
                value={formData.n8nWebhookDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, n8nWebhookDomain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difyDomain">Dify Domain</Label>
              <Input
                id="difyDomain"
                value={formData.difyDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, difyDomain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="evolutionDomain">Evolution Domain</Label>
              <Input
                id="evolutionDomain"
                value={formData.evolutionDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, evolutionDomain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minioDomain">MinIO Domain</Label>
              <Input
                id="minioDomain"
                value={formData.minioDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, minioDomain: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minioConsoleDomain">MinIO Console Domain</Label>
              <Input
                id="minioConsoleDomain"
                value={formData.minioConsoleDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, minioConsoleDomain: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={generatePasswords} className="mb-4">
              Regenerate Passwords
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Redis Password</Label>
                <div className="flex gap-2">
                  <Input value={formData.redisPassword} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.redisPassword, "redis", "Senha do Redis")}
                  >
                    {copied.redis ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>PostgreSQL Password</Label>
                <div className="flex gap-2">
                  <Input value={formData.postgresPassword} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.postgresPassword, "postgres", "Senha do PostgreSQL")}
                  >
                    {copied.postgres ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>N8N Encryption Key</Label>
                <div className="flex gap-2">
                  <Input value={formData.encryptionKey} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.encryptionKey, "encryption", "Chave de Criptografia")}
                  >
                    {copied.encryption ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>MinIO Root Password</Label>
                <div className="flex gap-2">
                  <Input value={formData.minioRootPassword} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyToClipboard(formData.minioRootPassword, "minioRootPassword", "Senha do MinIO")}
                  >
                    {copied.minioRootPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Evolution API Key</Label>
                <div className="flex gap-2">
                  <Input value={formData.evolutionApiKey} readOnly />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(formData.evolutionApiKey, "evolutionApiKey", "Chave da API Evolution")
                    }
                  >
                    {copied.evolutionApiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={() => copyToClipboard(generateDbStack(), "dbStack", "Stack de Banco de Dados")}>
                {copied.dbStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy Database Stack
              </Button>
              <Button
                onClick={() =>
                  copyToClipboard(
                    generateDbEvolutionStack(),
                    "dbEvolutionStack",
                    "Stack de Banco de Dados do Evolution",
                  )
                }
              >
                {copied.dbEvolutionStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy Database Evolution Stack
              </Button>
              <Button onClick={() => copyToClipboard(generateN8nStack(), "n8nStack", "Stack do N8n")}>
                {copied.n8nStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy N8n Stack
              </Button>
              <Button onClick={() => copyToClipboard(generateDifyStack(), "difyStack", "Stack do Dify")}>
                {copied.difyStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy Dify Stack
              </Button>
              <Button onClick={() => copyToClipboard(generateEvolutionStack(), "evolutionStack", "Stack do Evolution")}>
                {copied.evolutionStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy Evolution Stack
              </Button>
              <Button onClick={() => copyToClipboard(generateMinioStack(), "minioStack", "Stack do MinIO")}>
                {copied.minioStack ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy MinIO Stack
              </Button>
              <Button onClick={() => copyToClipboard(generateMarkdownSummary(), "summary", "Resumo da Configuração")}>
                {copied.summary ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copy Configuration Summary
              </Button>
              <Button onClick={() => copyToClipboard(generateAllStacks(), "allStacks", "Todas as Stacks")}>
                {copied.allStacks ? <Check className="mr-2 h-4 w-4" /> : <FileJson className="mr-2 h-4 w-4" />}
                Copy All Stacks
              </Button>
            </div>

            {copyFeedback && (
              <Alert>
                <AlertDescription>{copyFeedback}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StackGenerator

