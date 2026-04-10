Feature: Chat

  Scenario: User sends message and receives AI response
    Given I am logged in on the dashboard chat page
    When I send "hello" in the chat
    Then I should see a bot response