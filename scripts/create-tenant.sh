#!/bin/bash

# Script to create a new tenant with schema

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$#" -lt 2 ]; then
    echo "Usage: ./create-tenant.sh <tenant-slug> <tenant-name>"
    echo "Example: ./create-tenant.sh acme-corp 'Acme Corporation'"
    exit 1
fi

TENANT_SLUG=$1
TENANT_NAME=$2

echo -e "${BLUE}Creating tenant: ${TENANT_NAME} (${TENANT_SLUG})${NC}"

# Generate schema name
SCHEMA_NAME="tenant_${TENANT_SLUG//-/_}"

echo "Schema name: $SCHEMA_NAME"

# Create tenant in database
docker-compose exec -T postgres psql -U postgres -d fieldpro_saas << EOF
-- Insert tenant
INSERT INTO tenants (slug, name, schema_name, status, plan)
VALUES ('${TENANT_SLUG}', '${TENANT_NAME}', '${SCHEMA_NAME}', 'active', 'starter')
ON CONFLICT (slug) DO NOTHING;

-- Create tenant schema
SELECT create_tenant_schema('${SCHEMA_NAME}');
EOF

echo -e "${GREEN}✅ Tenant created successfully!${NC}"
echo ""
echo -e "${YELLOW}Tenant Details:${NC}"
echo "  Slug: ${TENANT_SLUG}"
echo "  Name: ${TENANT_NAME}"
echo "  Schema: ${SCHEMA_NAME}"
echo ""
echo "You can now register users for this tenant using the slug: ${TENANT_SLUG}"
