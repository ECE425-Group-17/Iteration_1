Feature: Create Account

  Scenario: User creates a new account
    Given the browser is open
    When the user goes to the home page
    And the user enters a new email and password
    And the user submits the signup form
    Then the account should be created successfully
