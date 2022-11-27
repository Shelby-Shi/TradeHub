import pytest
from api import *
import api

def test_stock_code():
    # Valid Stock Codes
    valid = ["ACU", "CBA", "EFE"]
    assert True == checkExist(valid[0])
    assert True == checkExist(valid[1])
    assert True == checkExist(valid[2])
    
def test_invalid_stock_code():
    # Invalid Stock Codes
    invalid = ["ACU46546", "AIV4654", "CBA4646", "EF45645E", "EA4565S"]
    for x in invalid:
        with pytest.raises(ValueError, match="Stock Code: " + x + " is invalid"):
            checkExist(x)


def test_dates():
    assert True == dateCheck("1999-03-01", "2020-10-01")
    with pytest.raises(ValueError, match="Invalid date string!"):
        dateCheck("1999-22-00", "2000-10-01")

    with pytest.raises(ValueError, match="Start date cannot be >= end date"):
        dateCheck("2010-12-01", "2000-10-01")

def test_stock_last():
    jsonOB = api.stock_last("ANZ")
    assert 'cap' in jsonOB
    assert 'price' in jsonOB
    assert 'vol' in jsonOB
    assert 'numSh' in jsonOB
    assert 'annual' in jsonOB
    assert 'daily' in jsonOB

def test_stock_last_week():
    data_info = api.stock_last_week("ANZ")
    for dict1 in  data_info:
        for key in dict1:
            assert dict1.get(key) != None

def test_stock_current_price():
    OB = api.stock_current_price("CBA")
    assert OB != None

def test_stock_close_price_for_date():
    OB = api.stock_close_price_for_date("CBA", "2020-10-01")
    assert OB != None

def test_retrieve_stock_base_info():
    OB = api.retrieve_stock_base_info("ANZ")
    assert 'change' in OB
    assert 'close' in OB
    assert 'key' in OB
    assert 'name' in OB

def test_retrieveCompanyList():
    list1 = api.stock_last_week("ANZ")
    for dict1 in  list1:
        for key in dict1:
            assert dict1.get(key) != None

def test_stock_live_market():
    dict1 = api.stock_live_market("ANZ")
    for key in dict1:
        assert dict1.get(key) != None

def test_stock_watchlist_graph():
    dict1 = api.stock_live_market("ANZ")
    for key in dict1:
        assert dict1.get(key) != None