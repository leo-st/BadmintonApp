#!/usr/bin/env python3

import requests
import json

BASE_URL = "http://localhost:8000"

def login(username, password):
    session = requests.Session()
    response = session.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    if response.status_code == 200:
        return session
    return None

def create_match(session, player1_id, player2_id, score1, score2):
    match_data = {
        "player1_id": player1_id,
        "player2_id": player2_id,
        "player1_score": score1,
        "player2_score": score2,
        "match_type": "casual"
    }
    response = session.post(f"{BASE_URL}/matches", json=match_data)
    if response.status_code == 200:
        return response.json()
    return None

def get_pending_verifications(session):
    response = session.get(f"{BASE_URL}/matches/pending-verification")
    if response.status_code == 200:
        return response.json()
    return []

def main():
    print("Testing verification system...")
    
    # Login as alice (admin)
    alice_session = login("alice", "password123")
    if not alice_session:
        print("Failed to login as alice")
        return
    
    # Login as bob (user)
    bob_session = login("bob", "password123")
    if not bob_session:
        print("Failed to login as bob")
        return
    
    # Login as charlie (user)
    charlie_session = login("charlie", "password123")
    if not charlie_session:
        print("Failed to login as charlie")
        return
    
    print("✅ All users logged in successfully")
    
    # Create a match: alice submits bob vs charlie
    print("\n📝 Creating match: alice submits bob vs charlie (21-18)")
    match1 = create_match(alice_session, 2, 3, 21, 18)  # bob=2, charlie=3
    if match1:
        print(f"✅ Match created: ID {match1['id']}")
    else:
        print("❌ Failed to create match")
        return
    
    # Create a match: bob submits bob vs charlie
    print("\n📝 Creating match: bob submits bob vs charlie (19-21)")
    match2 = create_match(bob_session, 2, 3, 19, 21)  # bob=2, charlie=3
    if match2:
        print(f"✅ Match created: ID {match2['id']}")
    else:
        print("❌ Failed to create match")
        return
    
    # Check pending verifications for bob
    print("\n🔍 Checking pending verifications for bob...")
    bob_pending = get_pending_verifications(bob_session)
    print(f"Bob has {len(bob_pending)} pending verifications")
    for match in bob_pending:
        print(f"  - Match {match['id']}: {match['player1_score']}-{match['player2_score']}")
    
    # Check pending verifications for charlie
    print("\n🔍 Checking pending verifications for charlie...")
    charlie_pending = get_pending_verifications(charlie_session)
    print(f"Charlie has {len(charlie_pending)} pending verifications")
    for match in charlie_pending:
        print(f"  - Match {match['id']}: {match['player1_score']}-{match['player2_score']}")
    
    # Check pending verifications for alice
    print("\n🔍 Checking pending verifications for alice...")
    alice_pending = get_pending_verifications(alice_session)
    print(f"Alice has {len(alice_pending)} pending verifications")
    for match in alice_pending:
        print(f"  - Match {match['id']}: {match['player1_score']}-{match['player2_score']}")
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    main()
