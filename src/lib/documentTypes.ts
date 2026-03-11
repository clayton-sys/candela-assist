export type DocumentTypeId =
  | "progress-note"
  | "referral-letter"
  | "safety-plan";

export interface FormField {
  id: string;
  label: string;
  placeholder: string;
  type: "textarea" | "select";
  options?: string[]; // only for select
  rows?: number;
  required?: boolean;
}

export interface DocumentType {
  id: DocumentTypeId;
  title: string;
  description: string;
  icon: string;
  color: string;
  fields: FormField[];
  systemPrompt: string;
  userPromptTemplate: (values: Record<string, string>) => string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "progress-note",
    title: "Progress Note",
    description:
      "Document a client interaction in professional DAP format suitable for audits, funders, and court review.",
    icon: "📋",
    color: "cerulean",
    fields: [
      {
        id: "contactType",
        label: "Type of Contact",
        placeholder: "",
        type: "select",
        options: [
          "In-person meeting",
          "Phone call",
          "Outreach",
          "Home visit",
          "Virtual/telehealth",
          "Email/written",
          "Group session",
        ],
        required: true,
      },
      {
        id: "currentStatus",
        label: "Client's Current Status and Presenting Concerns",
        placeholder:
          "e.g., Client is a 34-year-old participant experiencing housing instability. Presenting with elevated stress and difficulty managing household budget following recent job loss.",
        type: "textarea",
        rows: 4,
        required: true,
      },
      {
        id: "interventions",
        label: "Interventions or Actions Taken",
        placeholder:
          "e.g., Completed housing needs assessment. Provided warm referral to emergency rental assistance program. Reviewed budgeting worksheet together.",
        type: "textarea",
        rows: 4,
        required: true,
      },
      {
        id: "clientResponse",
        label: "Client's Response and Engagement Level",
        placeholder:
          "e.g., Client was engaged and receptive throughout the session. Expressed relief at availability of rental assistance. Asked clarifying questions about application process.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "goalsProgress",
        label: "Goals Addressed and Progress Made",
        placeholder:
          "e.g., Addressed housing stability goal. Client made progress by completing intake paperwork and agreeing to follow up with landlord this week.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "nextSteps",
        label: "Next Steps and Follow-Up Plan",
        placeholder:
          "e.g., Follow-up call scheduled in 7 days to confirm rental assistance application submitted. Case manager to provide additional resource list by end of week.",
        type: "textarea",
        rows: 3,
        required: true,
      },
    ],
    systemPrompt: `You are an expert social services documentation specialist with deep experience in direct service case management across housing, behavioral health, workforce development, and youth services settings.

Your job is to draft a professional progress note based on the case manager's description of a client interaction. The note should follow standard DAP format (Data, Assessment, Plan) unless the user specifies otherwise. Write in third person professional voice. Be specific and behavioral — describe what was observed and done, not interpretations or judgments. Be appropriately concise. Use professional social services language appropriate for a court document, audit, or funder review. Never include any information the user did not provide. Flag if the input seems incomplete for a thorough note.

The user has already been instructed not to include identifying client information. Do not prompt for it. Work with what is provided. Length: 150–250 words unless the user specifies otherwise.`,
    userPromptTemplate: (v) => `Please draft a professional progress note based on the following information:

Type of Contact: ${v.contactType}

Client's Current Status and Presenting Concerns:
${v.currentStatus}

Interventions / Actions Taken:
${v.interventions}

Client's Response and Engagement Level:
${v.clientResponse}

Goals Addressed and Progress Made:
${v.goalsProgress}

Next Steps and Follow-Up Plan:
${v.nextSteps}`,
  },

  {
    id: "referral-letter",
    title: "Resource Referral Letter",
    description:
      "Write a professional letter connecting a client to another organization's services.",
    icon: "✉️",
    color: "gold",
    fields: [
      {
        id: "receivingOrg",
        label: "Receiving Organization and Program Name",
        placeholder:
          "e.g., Westside Community Services — Emergency Housing Assistance Program",
        type: "textarea",
        rows: 2,
        required: true,
      },
      {
        id: "clientSituation",
        label: "Client's General Situation and Needs",
        placeholder:
          "e.g., Client is a single parent of two children facing imminent eviction due to a gap in income. Has stable employment beginning next month but needs bridge support for rent and utilities.",
        type: "textarea",
        rows: 4,
        required: true,
      },
      {
        id: "referralReason",
        label: "Reason for Referral and What You Hope the Program Will Provide",
        placeholder:
          "e.g., Referring for emergency rental assistance and utility support to prevent eviction and stabilize the family while income resumes.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "additionalContext",
        label: "Any Relevant Context the Receiving Organization Should Know",
        placeholder:
          "e.g., Client has previously engaged well with supportive services. Speaks Spanish as primary language. Has documentation required for the application.",
        type: "textarea",
        rows: 3,
        required: false,
      },
      {
        id: "yourOrg",
        label: "Your Organization and Your Role",
        placeholder: "e.g., Sunrise Community Center, Case Manager",
        type: "textarea",
        rows: 2,
        required: true,
      },
    ],
    systemPrompt: `You are an experienced nonprofit case manager writing a professional referral letter to connect a client with services at another organization.

Write a clear, professional referral letter that opens with a direct statement of purpose — who you are, your organization, and the nature of the referral. Describe the client's situation and needs in specific but non-stigmatizing language. Clearly state why this specific program is the right fit. Provide relevant context that will help the receiving organization serve the client well. Close with a warm, collegial tone that reinforces the collaborative relationship between organizations. Keep it to one page maximum.

Do not use template filler language. Write as if you genuinely know this client and this program and are making a personal recommendation to a colleague.`,
    userPromptTemplate: (v) => `Please draft a professional referral letter based on the following information:

Receiving Organization and Program: ${v.receivingOrg}

Client's General Situation and Needs:
${v.clientSituation}

Reason for Referral / What We Hope the Program Will Provide:
${v.referralReason}

Additional Context for the Receiving Organization:
${v.additionalContext || "None provided."}

My Organization and Role: ${v.yourOrg}`,
  },

  {
    id: "safety-plan",
    title: "Safety Plan Summary",
    description:
      "Document a collaborative safety plan in clear, accessible language for clinical or legal review.",
    icon: "🛡️",
    color: "midnight",
    fields: [
      {
        id: "safetyCategory",
        label: "Nature of Safety Concern",
        placeholder: "",
        type: "select",
        options: [
          "Housing instability / homelessness",
          "Domestic violence / intimate partner violence",
          "Mental health crisis",
          "Substance use",
          "Youth safety / self-harm",
          "Community violence",
          "Medical / health crisis",
          "Other",
        ],
        required: true,
      },
      {
        id: "warningSigns",
        label: "Warning Signs Identified with the Client",
        placeholder:
          "e.g., Client identified escalating arguments with partner, increased alcohol use, difficulty sleeping, and feeling trapped as personal warning signs that their safety may be at risk.",
        type: "textarea",
        rows: 4,
        required: true,
      },
      {
        id: "copingStrategies",
        label: "Coping Strategies the Client Identified",
        placeholder:
          "e.g., Calling a trusted friend, taking a walk, listening to music, journaling, and using deep breathing exercises.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "supportPeople",
        label: "Support People and Contacts the Client Identified",
        placeholder:
          "e.g., Sister (has agreed to be contacted and is aware of the plan), a close friend from church, and a neighbor who has offered to provide a safe place to stay.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "professionalResources",
        label: "Professional Resources and Crisis Lines Included",
        placeholder:
          "e.g., National DV Hotline (1-800-799-7233), local shelter (intake number provided), case manager contact, therapist contact, 988 Suicide & Crisis Lifeline.",
        type: "textarea",
        rows: 3,
        required: true,
      },
      {
        id: "clientCommitments",
        label: "Actions the Client Agreed to Take",
        placeholder:
          "e.g., Client agreed to contact their sister if they feel unsafe, to call the DV hotline before returning to the situation, and to attend next scheduled appointment.",
        type: "textarea",
        rows: 3,
        required: true,
      },
    ],
    systemPrompt: `You are a licensed clinical social worker and safety planning specialist. Your job is to draft a professional safety plan summary based on the elements the case manager has described.

The safety plan should be written in clear, accessible language — safety plans are often shared with clients and must be understandable to them. Follow standard safety plan structure: Warning Signs, Coping Strategies, Support Network, Professional Resources, Commitment to Action. Be specific and concrete — vague safety plans are not useful in a crisis. Reflect the client's own language and strategies where possible, not clinical jargon. Close with a clear statement of what the client has agreed to do.

This document may be used in a clinical review, court proceeding, or audit. Write accordingly.`,
    userPromptTemplate: (v) => `Please draft a professional safety plan summary based on the following information:

Nature of Safety Concern: ${v.safetyCategory}

Warning Signs Identified with the Client:
${v.warningSigns}

Coping Strategies the Client Identified:
${v.copingStrategies}

Support People and Contacts:
${v.supportPeople}

Professional Resources and Crisis Lines:
${v.professionalResources}

Actions the Client Agreed to Take:
${v.clientCommitments}`,
  },
];

export function getDocumentType(id: DocumentTypeId): DocumentType | undefined {
  return DOCUMENT_TYPES.find((dt) => dt.id === id);
}
