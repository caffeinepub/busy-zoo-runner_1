import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

actor {
  public type Item = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    category : Text;
  };

  public type PlayerProfile = {
    bestScore : Nat;
    lifetimeCoins : Nat;
    coinBalance : Nat;
    purchasedItems : [Text];
  };

  module PlayerProfile {
    public func compareByScore(p1 : (Principal, PlayerProfile), p2 : (Principal, PlayerProfile)) : Order.Order {
      Nat.compare(p2.1.bestScore, p1.1.bestScore);
    };
  };

  let profiles = Map.empty<Principal, PlayerProfile>();

  let shopCatalog : [Item] = [
    // Outfits
    {
      id = "outfit_ninja";
      name = "Ninja Outfit";
      description = "Stealthy ninja costume";
      price = 500;
      category = "outfit";
    },
    {
      id = "outfit_astronaut";
      name = "Astronaut Suit";
      description = "Cosmic explorer gear";
      price = 750;
      category = "outfit";
    },
    {
      id = "outfit_pirate";
      name = "Pirate Costume";
      description = "Ahoy matey!";
      price = 600;
      category = "outfit";
    },
    // Power-ups
    {
      id = "powerup_shield";
      name = "Shield";
      description = "Temporary invincibility";
      price = 200;
      category = "powerup";
    },
    {
      id = "powerup_magnet";
      name = "Magnet";
      description = "Attracts nearby coins";
      price = 150;
      category = "powerup";
    },
    {
      id = "powerup_speed";
      name = "Speed Boost";
      description = "Run faster for short time";
      price = 180;
      category = "powerup";
    },
  ];

  public shared ({ caller }) func getOrCreateProfile() : async PlayerProfile {
    switch (profiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        let newProfile : PlayerProfile = {
          bestScore = 0;
          lifetimeCoins = 0;
          coinBalance = 0;
          purchasedItems = [];
        };
        profiles.add(caller, newProfile);
        newProfile;
      };
    };
  };

  public shared ({ caller }) func submitScore(score : Nat) : async Bool {
    let profile = await getOrCreateProfile();
    if (score > profile.bestScore) {
      let updatedProfile : PlayerProfile = {
        bestScore = score;
        lifetimeCoins = profile.lifetimeCoins;
        coinBalance = profile.coinBalance;
        purchasedItems = profile.purchasedItems;
      };
      profiles.add(caller, updatedProfile);
      return true;
    };
    false;
  };

  public shared ({ caller }) func addCoins(coins : Nat) : async () {
    let profile = await getOrCreateProfile();
    let updatedProfile : PlayerProfile = {
      bestScore = profile.bestScore;
      lifetimeCoins = profile.lifetimeCoins + coins;
      coinBalance = profile.coinBalance + coins;
      purchasedItems = profile.purchasedItems;
    };
    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func purchaseItem(itemId : Text) : async () {
    let profile = await getOrCreateProfile();
    let item = shopCatalog.find(func(i) { i.id == itemId });

    switch (item) {
      case (null) { Runtime.trap("Item not found") };
      case (?item) {
        if (profile.coinBalance < item.price) {
          Runtime.trap("Insufficient coins");
        };

        if (profile.purchasedItems.find(func(id) { id == itemId }) != null) {
          Runtime.trap("Item already purchased");
        };

        let updatedItems = profile.purchasedItems.concat([itemId]);
        let updatedProfile : PlayerProfile = {
          bestScore = profile.bestScore;
          lifetimeCoins = profile.lifetimeCoins;
          coinBalance = profile.coinBalance - item.price;
          purchasedItems = updatedItems;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getShopCatalog() : async [Item] {
    shopCatalog;
  };

  public query ({ caller }) func getPlayerProfile() : async PlayerProfile {
    switch (profiles.get(caller)) {
      case (?profile) { profile };
      case (null) {
        Runtime.trap("Player profile not found");
      };
    };
  };

  public query ({ caller }) func getLeaderboard() : async [(Principal, PlayerProfile)] {
    let entries = profiles.toArray();
    if (entries.size() == 0) {
      return [];
    };

    let sorted = entries.sort(PlayerProfile.compareByScore);
    let limit = if (sorted.size() < 10) { sorted.size() } else { 10 };
    sorted.sliceToArray(0, limit);
  };
};
