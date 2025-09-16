"""
Multi-tenancy and RBAC Module for Legal Systems
Módulo de multi-tenancy e controle de acesso baseado em papéis para sistemas jurídicos
"""

import uuid
import logging
from typing import Dict, List, Optional, Set, Any
from datetime import datetime
from enum import Enum
from functools import wraps

from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from fastapi import HTTPException, Depends, status

logger = logging.getLogger(__name__)

Base = declarative_base()

class LegalRole(str, Enum):
    """Papéis no sistema jurídico"""
    PARTNER = "partner"           # Sócio - acesso total
    ASSOCIATE = "associate"       # Associado - gestão de casos
    PARALEGAL = "paralegal"       # Paralegal - preparação de documentos
    CLIENT = "client"             # Cliente - acesso limitado
    ADMIN_STAFF = "admin_staff"   # Staff administrativo
    INTERN = "intern"             # Estagiário - acesso supervisionado

class Permission(str, Enum):
    """Permissões específicas do sistema"""
    # Gestão de casos
    VIEW_CASES = "view_cases"
    CREATE_CASES = "create_cases"
    EDIT_CASES = "edit_cases"
    DELETE_CASES = "delete_cases"
    
    # Documentos
    VIEW_DOCUMENTS = "view_documents"
    UPLOAD_DOCUMENTS = "upload_documents"
    EDIT_DOCUMENTS = "edit_documents"
    DELETE_DOCUMENTS = "delete_documents"
    
    # Clientes
    VIEW_CLIENTS = "view_clients"
    CREATE_CLIENTS = "create_clients"
    EDIT_CLIENTS = "edit_clients"
    DELETE_CLIENTS = "delete_clients"
    
    # Financeiro
    VIEW_FINANCIAL = "view_financial"
    MANAGE_BILLING = "manage_billing"
    
    # Administração
    MANAGE_USERS = "manage_users"
    MANAGE_SETTINGS = "manage_settings"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    
    # Pesquisa jurídica
    SEARCH_CNJ = "search_cnj"
    ACCESS_LEGAL_AI = "access_legal_ai"

# Mapeamento de papéis para permissões
ROLE_PERMISSIONS: Dict[LegalRole, Set[Permission]] = {
    LegalRole.PARTNER: {
        # Acesso total
        Permission.VIEW_CASES, Permission.CREATE_CASES, Permission.EDIT_CASES, Permission.DELETE_CASES,
        Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENTS, Permission.EDIT_DOCUMENTS, Permission.DELETE_DOCUMENTS,
        Permission.VIEW_CLIENTS, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS, Permission.DELETE_CLIENTS,
        Permission.VIEW_FINANCIAL, Permission.MANAGE_BILLING,
        Permission.MANAGE_USERS, Permission.MANAGE_SETTINGS, Permission.VIEW_AUDIT_LOGS,
        Permission.SEARCH_CNJ, Permission.ACCESS_LEGAL_AI
    },
    LegalRole.ASSOCIATE: {
        # Gestão de casos e clientes
        Permission.VIEW_CASES, Permission.CREATE_CASES, Permission.EDIT_CASES,
        Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENTS, Permission.EDIT_DOCUMENTS,
        Permission.VIEW_CLIENTS, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS,
        Permission.SEARCH_CNJ, Permission.ACCESS_LEGAL_AI
    },
    LegalRole.PARALEGAL: {
        # Preparação de documentos e pesquisa
        Permission.VIEW_CASES, Permission.VIEW_DOCUMENTS, Permission.UPLOAD_DOCUMENTS,
        Permission.VIEW_CLIENTS, Permission.SEARCH_CNJ
    },
    LegalRole.CLIENT: {
        # Acesso limitado aos próprios casos
        Permission.VIEW_CASES, Permission.VIEW_DOCUMENTS
    },
    LegalRole.ADMIN_STAFF: {
        # Funções administrativas
        Permission.VIEW_CLIENTS, Permission.CREATE_CLIENTS, Permission.EDIT_CLIENTS,
        Permission.VIEW_FINANCIAL, Permission.MANAGE_BILLING
    },
    LegalRole.INTERN: {
        # Acesso supervisionado
        Permission.VIEW_CASES, Permission.VIEW_DOCUMENTS, Permission.SEARCH_CNJ
    }
}

# ======================== MODELOS SQLALCHEMY ========================

class Tenant(Base):
    """Modelo para escritórios de advocacia (tenants)"""
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    oab_number = Column(String(50), unique=True)  # Número OAB do escritório
    cnpj = Column(String(18), unique=True)
    email = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    
    # Configurações de segurança
    max_users = Column(String, default="50")
    allowed_ip_ranges = Column(JSON, default=list)
    
    # Configurações de retenção de dados
    default_retention_policy = Column(String, default="7_years")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    users = relationship("TenantUser", back_populates="tenant")
    cases = relationship("LegalCase", back_populates="tenant")

class TenantUser(Base):
    """Usuários dentro de um tenant"""
    __tablename__ = "tenant_users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    username = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    full_name = Column(String(255))
    oab_number = Column(String(20))  # Número OAB individual
    
    # Autenticação
    hashed_password = Column(String(255), nullable=False)
    
    # Papel e permissões
    role = Column(String(50), nullable=False)  # LegalRole
    custom_permissions = Column(JSON, default=list)  # Permissões adicionais
    
    # Configurações de segurança
    last_login = Column(DateTime)
    failed_login_attempts = Column(String, default="0")
    is_locked = Column(Boolean, default=False)
    
    # Murallas éticas
    restricted_cases = Column(JSON, default=list)  # IDs de casos restritos
    restricted_clients = Column(JSON, default=list)  # IDs de clientes restritos
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relacionamentos
    tenant = relationship("Tenant", back_populates="users")
    access_logs = relationship("AccessLog", back_populates="user")

class LegalCase(Base):
    """Casos jurídicos"""
    __tablename__ = "legal_cases"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    case_number = Column(String(100))  # Número interno do caso
    cnj_process_number = Column(String(25))  # Número CNJ se aplicável
    
    # Informações básicas
    title = Column(String(500), nullable=False)
    description = Column(Text)
    case_type = Column(String(100))
    status = Column(String(50), default="active")
    
    # Partes envolvidas
    client_id = Column(String)  # ID do cliente principal
    opposing_party = Column(String(500))
    
    # Datas importantes
    opened_date = Column(DateTime, default=datetime.utcnow)
    court_date = Column(DateTime)
    deadline_date = Column(DateTime)
    closed_date = Column(DateTime)
    
    # Responsáveis
    responsible_lawyer_id = Column(String, ForeignKey("tenant_users.id"))
    team_members = Column(JSON, default=list)  # IDs dos membros da equipe
    
    # Financeiro
    estimated_value = Column(String)
    hourly_rate = Column(String)
    total_hours = Column(String, default="0")
    
    # Confidencialidade
    is_confidential = Column(Boolean, default=True)
    ethical_wall_users = Column(JSON, default=list)  # Usuários com restrição
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    tenant = relationship("Tenant", back_populates="cases")

class AccessLog(Base):
    """Log de acesso para auditoria"""
    __tablename__ = "access_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String, ForeignKey("tenant_users.id"), nullable=False)
    
    # Informações do acesso
    action = Column(String(100), nullable=False)  # view, create, edit, delete
    resource_type = Column(String(50), nullable=False)  # case, document, client
    resource_id = Column(String(100))
    
    # Contexto
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    # Dados adicionais
    metadata = Column(JSON, default=dict)
    
    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    user = relationship("TenantUser", back_populates="access_logs")

# ======================== MODELOS PYDANTIC ========================

class TenantCreate(BaseModel):
    """Modelo para criação de tenant"""
    name: str = Field(..., min_length=2, max_length=255)
    oab_number: Optional[str] = Field(None, max_length=50)
    cnpj: Optional[str] = Field(None, max_length=18)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None

class TenantUserCreate(BaseModel):
    """Modelo para criação de usuário"""
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8)
    role: LegalRole
    oab_number: Optional[str] = Field(None, max_length=20)

class EthicalWallRule(BaseModel):
    """Regra de muralha ética"""
    user_id: str
    restricted_resource_ids: List[str]
    resource_type: str  # case, client, document
    reason: str
    created_by: str
    expiry_date: Optional[datetime] = None

# ======================== CLASSES DE CONTROLE ========================

class MultiTenantContext:
    """Contexto de multi-tenancy"""
    
    def __init__(self):
        self.current_tenant_id: Optional[str] = None
        self.current_user_id: Optional[str] = None
        self.current_user_role: Optional[LegalRole] = None
    
    def set_context(self, tenant_id: str, user_id: str, role: LegalRole):
        """Definir contexto atual"""
        self.current_tenant_id = tenant_id
        self.current_user_id = user_id
        self.current_user_role = role

class RBACManager:
    """Gerenciador de controle de acesso baseado em papéis"""
    
    def __init__(self):
        self.role_permissions = ROLE_PERMISSIONS
    
    def has_permission(self, user_role: LegalRole, permission: Permission) -> bool:
        """Verificar se usuário tem permissão"""
        return permission in self.role_permissions.get(user_role, set())
    
    def get_user_permissions(self, user_role: LegalRole, custom_permissions: List[str] = None) -> Set[Permission]:
        """Obter todas as permissões do usuário"""
        permissions = self.role_permissions.get(user_role, set()).copy()
        
        if custom_permissions:
            for perm_str in custom_permissions:
                try:
                    permissions.add(Permission(perm_str))
                except ValueError:
                    logger.warning(f"Permissão inválida: {perm_str}")
        
        return permissions
    
    def can_access_resource(self, user_role: LegalRole, resource_type: str, action: str) -> bool:
        """Verificar se usuário pode acessar recurso específico"""
        permission_map = {
            ('case', 'view'): Permission.VIEW_CASES,
            ('case', 'create'): Permission.CREATE_CASES,
            ('case', 'edit'): Permission.EDIT_CASES,
            ('case', 'delete'): Permission.DELETE_CASES,
            ('document', 'view'): Permission.VIEW_DOCUMENTS,
            ('document', 'upload'): Permission.UPLOAD_DOCUMENTS,
            ('document', 'edit'): Permission.EDIT_DOCUMENTS,
            ('document', 'delete'): Permission.DELETE_DOCUMENTS,
            ('client', 'view'): Permission.VIEW_CLIENTS,
            ('client', 'create'): Permission.CREATE_CLIENTS,
            ('client', 'edit'): Permission.EDIT_CLIENTS,
            ('client', 'delete'): Permission.DELETE_CLIENTS,
        }
        
        required_permission = permission_map.get((resource_type, action))
        if not required_permission:
            return False
        
        return self.has_permission(user_role, required_permission)

class EthicalWallManager:
    """Gerenciador de murallas éticas"""
    
    def __init__(self):
        self.active_restrictions: Dict[str, List[str]] = {}
    
    def add_restriction(self, user_id: str, resource_ids: List[str], reason: str):
        """Adicionar restrição de acesso para usuário"""
        if user_id not in self.active_restrictions:
            self.active_restrictions[user_id] = []
        
        self.active_restrictions[user_id].extend(resource_ids)
        
        logger.info(f"Restrição adicionada para usuário {user_id}: {len(resource_ids)} recursos - {reason}")
    
    def remove_restriction(self, user_id: str, resource_ids: List[str]):
        """Remover restrição de acesso"""
        if user_id in self.active_restrictions:
            for resource_id in resource_ids:
                if resource_id in self.active_restrictions[user_id]:
                    self.active_restrictions[user_id].remove(resource_id)
    
    def can_access_resource(self, user_id: str, resource_id: str) -> bool:
        """Verificar se usuário pode acessar recurso específico"""
        restricted_resources = self.active_restrictions.get(user_id, [])
        return resource_id not in restricted_resources
    
    def get_user_restrictions(self, user_id: str) -> List[str]:
        """Obter lista de recursos restritos para usuário"""
        return self.active_restrictions.get(user_id, [])

class AuditLogger:
    """Logger de auditoria para conformidade"""
    
    @staticmethod
    def log_access(db: Session, tenant_id: str, user_id: str, action: str, 
                   resource_type: str, resource_id: str = None, 
                   ip_address: str = None, user_agent: str = None, 
                   metadata: Dict[str, Any] = None):
        """Registrar acesso para auditoria"""
        access_log = AccessLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {}
        )
        
        db.add(access_log)
        db.commit()
        
        logger.info(f"Acesso registrado: {user_id} - {action} - {resource_type}:{resource_id}")

# ======================== DECORADORES ========================

def require_permission(permission: Permission):
    """Decorador para exigir permissão específica"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Aqui seria implementada a verificação de permissão
            # usando o contexto atual do usuário
            # Por enquanto, apenas placeholder
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(roles: List[LegalRole]):
    """Decorador para exigir papel específico"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Placeholder para verificação de papel
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def check_ethical_walls(resource_type: str):
    """Decorador para verificar murallas éticas"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Placeholder para verificação de murallas éticas
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# ======================== INSTÂNCIAS GLOBAIS ========================

# Instâncias globais dos gerenciadores
tenant_context = MultiTenantContext()
rbac_manager = RBACManager()
ethical_wall_manager = EthicalWallManager()
audit_logger = AuditLogger()