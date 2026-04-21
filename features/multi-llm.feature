Feature: Multi-LLM dashboard

  Scenario: User compares responses from three LLMs
    Given I am logged in with mock chat enabled
    When I send "compare these models" in the chat
    Then I should see 3 LLM response cards

  Scenario: User regenerates one selected LLM response
    Given I am logged in with mock chat enabled
    When I send "compare these models" in the chat
    And I remember the response for model "gemma4:e4b"
    And I regenerate the response for model "gemma4:e4b"
    Then the response for model "gemma4:e4b" should change

  Scenario: User changes the chat font size
    Given I am logged in with mock chat enabled
    When I send "font size test" in the chat
    When I choose font size "20"
    Then the chat font size should be "20px"
