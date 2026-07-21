from typing import Any, Dict, List, Tuple


def match_citizen_profile(
    profile: Dict[str, Any],
    rules: Dict[str, Any],
) -> Tuple[bool, List[str]]:
    """Evaluates citizen profile constraints against structured eligibility rules.

    Returns:
    - (is_eligible: bool, failed_reasons: List[str])
    """
    failed_reasons = []

    # 1. Age check
    age = profile.get("age")
    min_age = rules.get("min_age")
    max_age = rules.get("max_age")
    if min_age is not None:
        if age is None:
            failed_reasons.append("Age details missing")
        elif age < min_age:
            failed_reasons.append(
                f"Age {age} is below minimum requirement of {min_age}"
            )
    if max_age is not None:
        if age is None:
            failed_reasons.append("Age details missing")
        elif age > max_age:
            failed_reasons.append(f"Age {age} exceeds maximum requirement of {max_age}")

    # 2. State residence check
    states = rules.get("states")
    if states and "Any" not in states:
        state = profile.get("state")
        if not state:
            failed_reasons.append("State details missing")
        elif state not in states:
            failed_reasons.append(
                f"State '{state}' is not eligible. Eligible states: {', '.join(states)}"
            )

    # 3. Gender eligibility check
    genders = rules.get("genders")
    if genders and "Any" not in genders:
        gender = profile.get("gender")
        if not gender:
            failed_reasons.append("Gender details missing")
        elif gender not in genders:
            failed_reasons.append(
                f"Gender '{gender}' is not eligible. "
                f"Required genders: {', '.join(genders)}"
            )

    # 4. Caste category check
    castes = rules.get("castes")
    if castes and "Any" not in castes:
        caste = profile.get("caste")
        if not caste:
            failed_reasons.append("Caste category details missing")
        elif caste not in castes:
            failed_reasons.append(
                f"Caste category '{caste}' is not eligible. "
                f"Eligible castes: {', '.join(castes)}"
            )

    # 5. Annual income check
    max_income = rules.get("max_income")
    if max_income is not None:
        income = profile.get("annual_income")
        if income is None:
            failed_reasons.append("Income details missing")
        elif income > max_income:
            failed_reasons.append(
                f"Annual income ₹{income:,} exceeds "
                f"maximum threshold of ₹{max_income:,}"
            )

    # 6. Landholding check
    max_landholding = rules.get("max_landholding_acres")
    if max_landholding is not None:
        landholding = profile.get("landholding_acres")
        if landholding is None:
            failed_reasons.append("Landholding details missing")
        elif landholding > max_landholding:
            failed_reasons.append(
                f"Landholding {landholding} acres exceeds "
                f"maximum limit of {max_landholding} acres"
            )

    return len(failed_reasons) == 0, failed_reasons
