Feature: Multi chat

Scenario: Multi chat returns multiple LLM responses
  Given I am logged in on the dashboard chat page
  When I start a multi chat
  And I send "Hello" in the chat
  Then I should see multiple bot responses
  And the bot responses should not all be identical