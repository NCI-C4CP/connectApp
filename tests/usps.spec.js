// USPS Address Validation responses for manual testing (temp until testing suite is implemented)
// See js/shared.js -> addressValidation()for usage.
export const USPS_TEST_RESPONSES = {
    // SUCCESS CASES
    success: {
        firm: '',
        address: {
            ZIPCode: '80112',
            ZIPPlus4: '1243',
            city: 'DENVER',
            cityAbbreviation: 'DENVER',
            secondaryAddress: '',
            state: 'CO',
            streetAddress: '123 FAKE ST',
            streetAddressAbbreviation: '123 FAKE ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'Y',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '12',
            vacant: 'N'
        },
        corrections: [
            { code: '', text: '' }
        ],
        matches: [
            { code: '31', text: 'Single Response - exact match' }
        ]
    },

    // Success with corrections (address standardized)
    successWithCorrections: {
        firm: '',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '1234',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: '',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'Y',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '12',
            vacant: 'N'
        },
        corrections: [
            { code: 'A1', text: 'Address standardized' }
        ],
        matches: [
            { code: '31', text: 'Single Response - exact match' }
        ]
    },

    // Success with apartment/suite number
    successWithSecondaryAddress: {
        firm: '',
        address: {
            ZIPCode: '90210',
            ZIPPlus4: '1234',
            city: 'BEVERLY HILLS',
            cityAbbreviation: 'BEVERLY HILLS',
            secondaryAddress: 'APT 5B',
            state: 'CA',
            streetAddress: '123 SUNSET BLVD',
            streetAddressAbbreviation: '123 SUNSET BLVD',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'Y',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '12',
            vacant: 'N'
        },
        corrections: [
            { code: '', text: '' }
        ],
        matches: [
            { code: '31', text: 'Single Response - exact match' }
        ]
    },

    // ERROR CASES - Invalid Address (010005)
    invalidAddress: {
        error: {
            errors: [
                {
                    code: '010005',
                    text: 'Invalid Address'
                }
            ]
        }
    },

    // Invalid ZIP Code (010002)
    invalidZipCode: {
        error: {
            errors: [
                {
                    code: '010002',
                    text: 'Invalid ZIP Code'
                }
            ]
        }
    },

    // Invalid City (010004)
    invalidCity: {
        error: {
            errors: [
                {
                    code: '010004',
                    text: 'Invalid City'
                }
            ]
        }
    },

    // Address Not Found
    addressNotFound: {
        error: {
            errors: [
                {
                    code: '010001',
                    text: 'Address Not Found'
                }
            ]
        }
    },

    // Multiple Addresses Found
    multipleAddresses: {
        firm: '',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: '',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'N',
            business: 'N',
            carrierRoute: '',
            centralDeliveryPoint: 'N',
            deliveryPoint: '',
            vacant: 'N'
        },
        corrections: [
            { code: '', text: '' }
        ],
        matches: [
            { code: '32', text: 'Multiple responses found' }
        ]
    },

    // Missing Apartment/Suite Number
    missingSecondaryAddress: {
        firm: '',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '1234',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: 'Unit 3A',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'N',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '',
            vacant: 'N'
        },
        corrections: [
            { code: 'A2', text: 'Missing apartment or suite number' }
        ],
        matches: [
            { code: '33', text: 'Default address found, more information needed' }
        ]
    },

    // Vacant Address.  We're currently bypassing this response in the app (no action).
    vacantAddress: {
        firm: '',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '1234',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: '',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'Y',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '12',
            vacant: 'Y'
        },
        corrections: [
            { code: 'V1', text: 'Address is vacant' }
        ],
        matches: [
            { code: '31', text: 'Single Response - exact match' }
        ]
    },

    // Business Address. We're currently bypassing this response in the app (no action).
    businessAddress: {
        firm: 'ACME CORPORATION',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '1234',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: '',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'Y',
            business: 'Y',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '12',
            vacant: 'N'
        },
        corrections: [
            { code: '', text: '' }
        ],
        matches: [
            { code: '31', text: 'Single Response - exact match' }
        ]
    },

    // DPV Confirmation Failed (address may not be deliverable). We're currently bypassing this response in the app (no action).
    dpvConfirmationFailed: {
        firm: '',
        address: {
            ZIPCode: '10001',
            ZIPPlus4: '1234',
            city: 'NEW YORK',
            cityAbbreviation: 'NEW YORK',
            secondaryAddress: '',
            state: 'NY',
            streetAddress: '123 MAIN ST',
            streetAddressAbbreviation: '123 MAIN ST',
            urbanization: ''
        },
        additionalInfo: {
            DPVCMRA: 'N',
            DPVConfirmation: 'N',
            business: 'N',
            carrierRoute: 'C001',
            centralDeliveryPoint: 'N',
            deliveryPoint: '',
            vacant: 'N'
        },
        corrections: [
            { code: 'D1', text: 'DPV Confirmation failed - address may not be deliverable' }
        ],
        matches: [
            { code: '34', text: 'Address found but not confirmed' }
        ]
    },

    // Server Error (500+)
    serverError: {
        error: {
            status: 500,
            message: 'Internal Server Error'
        }
    },

    // Network/Timeout Error
    networkError: {
        error: {
            status: 0,
            message: 'Network Error'
        }
    },

    // Multiple Errors
    multipleErrors: {
        error: {
            errors: [
                {
                    code: '010002',
                    text: 'Invalid ZIP Code'
                },
                {
                    code: '010004',
                    text: 'Invalid City'
                }
            ]
        }
    }
};
