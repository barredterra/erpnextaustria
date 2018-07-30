# -*- coding: utf-8 -*-
# Copyright (c) 2018, libracore and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class ATVATDeclaration(Document):
	pass

@frappe.whitelist()
def get_view_total(view_name, start_date, end_date):
	""" executes a tax lookup query for a total 
	
	"""
	sql_query = ("""SELECT IFNULL(SUM(`base_net_total`), 0) AS `total` 
			FROM `{0}` 
			WHERE `posting_date` >= '{1}' 
			AND `posting_date` <= '{2}'""".format(view_name, start_date, end_date))
	total = frappe.db.sql(sql_query, as_dict=True)
	return { 'total': total[0].total }

@frappe.whitelist()
def get_view_tax(view_name, start_date, end_date):
	""" executes a tax lookup query for a tax 
	
	"""
	sql_query = ("""SELECT IFNULL(SUM(`total_taxes_and_charges`), 0) AS `total` 
			FROM `{0}` 
			WHERE `posting_date` >= '{1}' 
			AND `posting_date` <= '{2}'""".format(view_name, start_date, end_date))
	total = frappe.db.sql(sql_query, as_dict=True)
	return { 'total': total[0].total }
  
@frappe.whitelist()
def get_tax_rate(taxes_and_charges_template):
    sql_query = ("""SELECT `rate` 
        FROM `tabPurchase Taxes and Charges` 
        WHERE `parent` = '{0}' 
        ORDER BY `idx`;""".format(taxes_and_charges_template))
    result = frappe.db.sql(sql_query, as_dict=True)
    if result:
        return result[0].rate
    else:
        return 0
