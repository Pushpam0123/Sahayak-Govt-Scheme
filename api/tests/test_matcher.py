from api.services.matcher import match_citizen_profile


def test_match_profile_pm_kisan() -> None:
    rules = {
        "min_age": 18,
        "max_age": None,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["Any"],
        "max_income": None,
        "max_landholding_acres": 5.0,
    }

    # Successful match
    profile_ok = {
        "age": 35,
        "state": "Bihar",
        "gender": "Male",
        "caste": "OBC",
        "annual_income": 120000.0,
        "landholding_acres": 2.5,
    }
    is_eligible, reasons = match_citizen_profile(profile_ok, rules)
    assert is_eligible is True
    assert len(reasons) == 0

    # Failed match due to landholding size
    profile_bad_land = {
        "age": 35,
        "state": "Bihar",
        "gender": "Male",
        "caste": "OBC",
        "annual_income": 120000.0,
        "landholding_acres": 8.0,
    }
    is_eligible, reasons = match_citizen_profile(profile_bad_land, rules)
    assert is_eligible is False
    assert len(reasons) == 1
    assert "exceeds maximum limit" in reasons[0]

    # Failed match due to age under min
    profile_young = {
        "age": 16,
        "state": "Bihar",
        "gender": "Male",
        "caste": "OBC",
        "annual_income": 120000.0,
        "landholding_acres": 2.5,
    }
    is_eligible, reasons = match_citizen_profile(profile_young, rules)
    assert is_eligible is False
    assert len(reasons) == 1
    assert "below minimum requirement" in reasons[0]


def test_match_profile_ladli_behna() -> None:
    rules = {
        "min_age": 21,
        "max_age": 60,
        "states": ["Madhya Pradesh"],
        "genders": ["Female"],
        "castes": ["Any"],
        "max_income": 250000.0,
        "max_landholding_acres": 5.0,
    }

    # Successful match
    profile_ok = {
        "age": 35,
        "state": "Madhya Pradesh",
        "gender": "Female",
        "caste": "General",
        "annual_income": 120000.0,
        "landholding_acres": 2.0,
    }
    is_eligible, reasons = match_citizen_profile(profile_ok, rules)
    assert is_eligible is True

    # Failed match due to gender
    profile_male = {
        "age": 35,
        "state": "Madhya Pradesh",
        "gender": "Male",
        "caste": "General",
        "annual_income": 120000.0,
        "landholding_acres": 2.0,
    }
    is_eligible, reasons = match_citizen_profile(profile_male, rules)
    assert is_eligible is False
    assert "Gender 'Male' is not eligible" in reasons[0]

    # Failed match due to state residence
    profile_bihar = {
        "age": 35,
        "state": "Bihar",
        "gender": "Female",
        "caste": "General",
        "annual_income": 120000.0,
        "landholding_acres": 2.0,
    }
    is_eligible, reasons = match_citizen_profile(profile_bihar, rules)
    assert is_eligible is False
    assert "State 'Bihar' is not eligible" in reasons[0]


def test_match_profile_nsp_post_matric() -> None:
    rules = {
        "min_age": 15,
        "max_age": 30,
        "states": ["Any"],
        "genders": ["Any"],
        "castes": ["OBC", "SC", "ST"],
        "max_income": 250000.0,
        "max_landholding_acres": None,
    }

    # Successful match
    profile_ok = {
        "age": 20,
        "state": "Telangana",
        "gender": "Female",
        "caste": "SC",
        "annual_income": 150000.0,
        "landholding_acres": None,
    }
    is_eligible, reasons = match_citizen_profile(profile_ok, rules)
    assert is_eligible is True

    # Failed match due to caste category (General)
    profile_gen = {
        "age": 20,
        "state": "Telangana",
        "gender": "Female",
        "caste": "General",
        "annual_income": 150000.0,
        "landholding_acres": None,
    }
    is_eligible, reasons = match_citizen_profile(profile_gen, rules)
    assert is_eligible is False
    assert "Caste category 'General' is not eligible" in reasons[0]

    # Failed match due to income limit
    profile_rich = {
        "age": 20,
        "state": "Telangana",
        "gender": "Female",
        "caste": "SC",
        "annual_income": 300000.0,
        "landholding_acres": None,
    }
    is_eligible, reasons = match_citizen_profile(profile_rich, rules)
    assert is_eligible is False
    assert "exceeds maximum threshold" in reasons[0]
