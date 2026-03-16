Feature: Login

  As a user
  I want to login
  So that I can access my existing account

  Scenario: User logs into an existing account
    Given the browser is open
    When the user goes to the home page
    And the user enters a valid login email and password
    And the user clicks the login button
    Then the user should be redirected to the dashboard
