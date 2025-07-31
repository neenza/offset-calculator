"""
MongoDB models using Beanie ODM for the offset printing calculator
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from beanie import Document, PydanticObjectId

# Enums for structured data
class ClientStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class ClientType(str, Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"

class ProjectStatus(str, Enum):
    QUOTE = "quote"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on-hold"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CASH = "cash"
    CHECK = "check"
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    ONLINE = "online"

class InteractionType(str, Enum):
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    NOTE = "note"
    QUOTE_SENT = "quote_sent"
    FOLLOW_UP = "follow_up"

# Embedded documents
class Address(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    street: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = "USA"

class QuoteItem(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    description: str
    quantity: int = 1
    unit_price: float = 0.0
    total: float = 0.0
    specifications: Optional[Dict[str, Any]] = None

class PaymentTerm(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    payment_method: PaymentMethod = PaymentMethod.CHECK
    due_days: int = 30
    discount_percentage: float = 0.0
    discount_days: int = 0

class ProjectSpecification(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    paper_type: Optional[str] = None
    paper_size: Optional[str] = None
    quantity: Optional[int] = None
    colors: Optional[int] = None
    finishing: Optional[List[str]] = None
    binding: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None

# Main Documents
class Client(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Personal Information
    name: str
    email: EmailStr
    phone: str = ""
    company: str = ""
    
    # Address
    address: Address = Address()
    
    # Business Information
    status: ClientStatus = ClientStatus.ACTIVE
    client_type: ClientType = ClientType.INDIVIDUAL
    credit_limit: float = 0.0
    payment_terms: PaymentTerm = PaymentTerm()
    
    # Statistics
    total_orders: int = 0
    total_revenue: float = 0.0
    last_order_date: Optional[datetime] = None
    
    # Additional Information
    notes: str = ""
    tags: List[str] = []
    referral_source: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Settings:
        collection = "clients"
        indexes = [
            "name",
            "email",
            "status",
            "client_type",
            "created_at"
        ]

class Project(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Basic Information
    client_id: PydanticObjectId
    client_name: str
    project_name: str
    description: str = ""
    
    # Project Details
    status: ProjectStatus = ProjectStatus.QUOTE
    priority: Priority = Priority.MEDIUM
    specifications: ProjectSpecification = ProjectSpecification()
    
    # Financial
    estimated_cost: float = 0.0
    actual_cost: float = 0.0
    profit_margin: float = 0.0
    
    # Timeline
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    actual_hours: Optional[int] = None
    
    # Files and Documents
    files: List[str] = []  # File paths or URLs
    notes: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Settings:
        collection = "projects"
        indexes = [
            "client_id",
            "project_name",
            "status",
            "priority",
            "deadline",
            "created_at"
        ]

class Quote(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Basic Information
    quote_number: str
    client_id: PydanticObjectId
    project_id: Optional[PydanticObjectId] = None
    client_name: str
    
    # Quote Details
    items: List[QuoteItem] = []
    subtotal: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total: float = 0.0
    
    # Status and Timeline
    status: QuoteStatus = QuoteStatus.DRAFT
    valid_until: datetime
    sent_date: Optional[datetime] = None
    accepted_date: Optional[datetime] = None
    
    # Additional Information
    terms_and_conditions: str = ""
    notes: str = ""
    payment_terms: PaymentTerm = PaymentTerm()
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Settings:
        collection = "quotes"
        indexes = [
            "quote_number",
            "client_id",
            "status",
            "valid_until",
            "created_at"
        ]

class Invoice(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Basic Information
    invoice_number: str
    client_id: PydanticObjectId
    quote_id: Optional[PydanticObjectId] = None
    project_id: Optional[PydanticObjectId] = None
    client_name: str
    
    # Invoice Details
    items: List[QuoteItem] = []
    subtotal: float = 0.0
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total: float = 0.0
    amount_paid: float = 0.0
    amount_due: float = 0.0
    
    # Status and Timeline
    status: InvoiceStatus = InvoiceStatus.DRAFT
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    paid_date: Optional[datetime] = None
    
    # Payment Information
    payment_method: Optional[PaymentMethod] = None
    payment_reference: str = ""
    
    # Additional Information
    terms_and_conditions: str = ""
    notes: str = ""
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

    class Settings:
        collection = "invoices"
        indexes = [
            "invoice_number",
            "client_id",
            "status",
            "due_date",
            "created_at"
        ]

class ClientInteraction(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Basic Information
    client_id: PydanticObjectId
    client_name: str
    interaction_type: InteractionType
    
    # Interaction Details
    subject: str = ""
    description: str = ""
    outcome: str = ""
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    
    # Associated Records
    project_id: Optional[PydanticObjectId] = None
    quote_id: Optional[PydanticObjectId] = None
    invoice_id: Optional[PydanticObjectId] = None
    
    # Files and Attachments
    attachments: List[str] = []
    
    # Metadata
    interaction_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None

    class Settings:
        collection = "client_interactions"
        indexes = [
            "client_id",
            "interaction_type",
            "interaction_date",
            "follow_up_date",
            "created_at"
        ]

# Settings and Configuration
class AppSettings(Document):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Business Information
    business_name: str = "Offset Printing Company"
    business_address: Address = Address()
    business_phone: str = ""
    business_email: str = ""
    business_website: str = ""
    
    # Default Settings
    default_tax_rate: float = 0.0
    default_payment_terms: PaymentTerm = PaymentTerm()
    currency: str = "USD"
    currency_symbol: str = "$"
    
    # Quote Settings
    quote_validity_days: int = 30
    quote_number_prefix: str = "QT"
    quote_number_format: str = "{prefix}-{year}-{number:04d}"
    
    # Invoice Settings
    invoice_number_prefix: str = "INV"
    invoice_number_format: str = "{prefix}-{year}-{number:04d}"
    
    # Notification Settings
    email_notifications: bool = True
    sms_notifications: bool = False
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[str] = None

    class Settings:
        collection = "app_settings"

# Request/Response Models for API
class ClientCreate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: str
    email: EmailStr
    phone: str = ""
    company: str = ""
    address: Address = Address()
    status: ClientStatus = ClientStatus.ACTIVE
    client_type: ClientType = ClientType.INDIVIDUAL
    credit_limit: float = 0.0
    notes: str = ""
    tags: List[str] = []
    referral_source: str = ""

class ClientUpdate(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    address: Optional[Address] = None
    status: Optional[ClientStatus] = None
    client_type: Optional[ClientType] = None
    credit_limit: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    referral_source: Optional[str] = None

class ClientResponse(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    id: str
    name: str
    email: str
    phone: str
    company: str
    address: Address
    status: ClientStatus
    client_type: ClientType
    credit_limit: float
    total_orders: int
    total_revenue: float
    last_order_date: Optional[datetime]
    notes: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_document(cls, client: Client) -> "ClientResponse":
        return cls(
            id=str(client.id),
            name=client.name,
            email=client.email,
            phone=client.phone,
            company=client.company,
            address=client.address,
            status=client.status,
            client_type=client.client_type,
            credit_limit=client.credit_limit,
            total_orders=client.total_orders,
            total_revenue=client.total_revenue,
            last_order_date=client.last_order_date,
            notes=client.notes,
            tags=client.tags,
            created_at=client.created_at,
            updated_at=client.updated_at
        )
