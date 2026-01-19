#!/usr/bin/env python3
"""
Test script for MinerU Docker Service
Tests the service endpoints and validates responses
"""

import requests
import sys
import time
import json

# Configuration
BASE_URL = "http://localhost:8001"

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"{'='*60}\n")

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_error(message):
    """Print error message"""
    print(f"❌ {message}")

def test_health_check():
    """Test the health check endpoint"""
    print_test_header("Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}")
            print(f"   Version: {data.get('version')}")
            return True
        else:
            print_error(f"Health check failed with status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to service. Is it running?")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    print_test_header("Root Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Root endpoint accessible!")
            print(f"   Service: {data.get('service')}")
            print(f"   Mode: {data.get('mode')}")
            print(f"   Endpoints: {json.dumps(data.get('endpoints'), indent=4)}")
            return True
        else:
            print_error(f"Root endpoint failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_parse_pdf(pdf_path=None):
    """Test the PDF parsing endpoint"""
    print_test_header("PDF Parsing")
    
    if pdf_path is None:
        # Create a simple test PDF if none provided
        print("No PDF file provided. This test requires a PDF file.")
        print("Usage: python test_service.py <path_to_pdf>")
        return None
    
    try:
        # Check if file exists
        import os
        if not os.path.exists(pdf_path):
            print_error(f"PDF file not found: {pdf_path}")
            return False
        
        # Upload and parse PDF
        print(f"Uploading PDF: {pdf_path}")
        
        with open(pdf_path, 'rb') as f:
            files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
            response = requests.post(f"{BASE_URL}/parse", files=files, timeout=300)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"PDF parsing successful!")
            print(f"   Filename: {data.get('filename')}")
            print(f"   Saved to: {data.get('saved_to')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Engine: {data.get('engine')}")
            print(f"\n   Content preview:")
            print(f"   {data.get('content')}")
            return True
        else:
            print_error(f"PDF parsing failed with status code: {response.status_code}")
            print(f"   Error: {response.json()}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Request timed out. PDF parsing may take a while.")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_api_docs():
    """Test if API documentation is accessible"""
    print_test_header("API Documentation")
    
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        
        if response.status_code == 200:
            print_success(f"API documentation accessible!")
            print(f"   URL: {BASE_URL}/docs")
            return True
        else:
            print_error(f"API docs failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def run_all_tests(pdf_path=None):
    """Run all tests"""
    print("\n" + "="*60)
    print("MINERU DOCKER SERVICE TEST SUITE")
    print("="*60)
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Root Endpoint
    results.append(("Root Endpoint", test_root_endpoint()))
    
    # Test 3: API Docs
    results.append(("API Documentation", test_api_docs()))
    
    # Test 4: PDF Parsing (if PDF provided)
    if pdf_path:
        results.append(("PDF Parsing", test_parse_pdf(pdf_path)))
    else:
        print("\n⚠️  Skipping PDF parsing test (no PDF file provided)")
        print("   Run with: python test_service.py <path_to_pdf>")
        results.append(("PDF Parsing", None))
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    skipped = 0
    
    for test_name, result in results:
        if result is True:
            print_success(f"{test_name}")
            passed += 1
        elif result is False:
            print_error(f"{test_name}")
            failed += 1
        else:
            print(f"⏭️  {test_name} (skipped)")
            skipped += 1
    
    print(f"\nTotal: {len(results)} | Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    print("="*60 + "\n")
    
    return failed == 0

if __name__ == "__main__":
    # Check if PDF path is provided
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Wait a bit for service to be ready (if just started)
    time.sleep(2)
    
    # Run all tests
    success = run_all_tests(pdf_path)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
