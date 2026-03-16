Feature: Create Account

  As a user
  I want to create a new account
  So that I can login in the future

  Scenario: User creates a new account
    Given the browser is open
    When the user goes to the home page
    And the user enters a username email and password for signup
    And the user clicks the signup button
    Then a signup success message should appear
