Feature: Invalid Signup

  Scenario: User tries to sign up without an email
    Given the browser is open
    When the user goes to the home page
    When the user enters signup information without email
    When the user clicks the signup button
    Then a signup error message should appear

  Scenario: User tries to sign up without a password
    Given the browser is open
    When the user goes to the home page
    When the user enters signup information without password
    When the user clicks the signup button
    Then a signup error message should appear