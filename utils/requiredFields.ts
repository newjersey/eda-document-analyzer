import { ValidatedDocument } from "./analyticsService";

interface RequiredFields {
    organizationName: boolean;
    fein: boolean;
}

export const computeRequiredFields = (documents: ValidatedDocument[]): RequiredFields => {
    const newRequiredFields = {
        organizationName: false,
        fein: false
    };
    for (const doc of documents) {
        switch (doc.type) {
            case 'tax-clearance-online':
            case 'tax-clearance-manual':
                newRequiredFields.organizationName = true;
                newRequiredFields.fein = true;
                break;
            case 'operating-agreement':
            case 'cert-formation':
            case 'cert-formation-independent':
            case 'cert-incorporation':
            case 'cert-authority':
            case 'cert-alternative-name':
                newRequiredFields.organizationName = true;
                break;
            default:
                break;
        }
    }

    return newRequiredFields;
}
