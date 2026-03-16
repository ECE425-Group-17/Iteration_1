Feature: Password Reset

  As a user
  I want to reset my password
  So that I can recover my account

  Scenario: User sends a password reset email
    Given the browser is open
    When the user goes to the home page
    And the user enters their email for password reset
    And the user clicks the reset button
    Then a password reset message should appear