#!/usr/bin/env python3
"""
Test script to verify funding opportunity URLs are working
"""
import requests
import sys
from urllib.parse import urlparse

def test_url(url, name):
    """Test if a URL is accessible"""
    try:
        print(f"Testing {name}: {url}")
        response = requests.head(url, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            print(f"✅ {name}: Working (200)")
            return True
        elif response.status_code in [301, 302, 303, 307, 308]:
            print(f"✅ {name}: Redirect ({response.status_code}) -> {response.url}")
            return True
        else:
            print(f"❌ {name}: Failed ({response.status_code})")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ {name}: Error - {str(e)}")
        return False

def main():
    """Test all funding provider URLs"""
    
    # URLs from our updated database
    test_urls = [
        ("Shield Capital", "https://shieldcap.com/"),
        ("Paladin Capital Group", "https://www.paladincapgroup.com/"),
        ("Lockheed Martin", "https://www.lockheedmartin.com/"),
        ("Thales Group", "https://www.thalesgroup.com/"),
        ("Octopus Ventures", "https://octopusventures.com/"),
        ("British Business Bank", "https://www.british-business-bank.co.uk/"),
        ("RTX Ventures", "https://www.rtx.com/"),
        ("MMC Ventures", "https://mmc.vc/"),
        ("Amadeus Capital", "https://amadeuscapital.com/"),
        ("Playfair Capital", "https://playfair.vc/")
    ]
    
    print("🔗 Testing Funding Provider URLs...")
    print("=" * 50)
    
    working = 0
    total = len(test_urls)
    
    for name, url in test_urls:
        if test_url(url, name):
            working += 1
        print()
    
    print("=" * 50)
    print(f"📊 Results: {working}/{total} URLs working ({working/total*100:.1f}%)")
    
    if working == total:
        print("🎉 All URLs are working correctly!")
        return 0
    else:
        print(f"⚠️  {total-working} URLs need attention")
        return 1

if __name__ == "__main__":
    sys.exit(main())