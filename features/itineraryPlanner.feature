Feature: Treavel itinerary generation
    As a user
    I want the system to generate a travel itinerary
    So that I can easily plan my day at a destination

    Scenario: Generating a one-day itinerary
        Given I am logged into the dashboard
        When I ask "Create a one day itinerary for New York City"
        Then the system should generate a list of destinations
        And the itinerary should include at least three locations

    Scenario: Generating a food-focused itinerary
        Given I am logged into the dashboard
        When I ask "Create a food tour itinerary in Manhattan"
        Then the itinerary should contain recommended restaurants
        And the itinerary should include Google Maps links for each location

    Scenario: Updating an itinerary
        Given I am logged into the dashboard
        And I have generated a itinerary
        When I ask "Replace the cafe with a park"
        Then the itinerary should update with a park