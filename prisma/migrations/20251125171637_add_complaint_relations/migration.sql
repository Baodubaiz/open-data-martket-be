-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
